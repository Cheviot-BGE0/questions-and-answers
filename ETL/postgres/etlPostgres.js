const parseArgs = require('../parseArgs.js');
const fs = require('fs');
const readline = require('readline');
const postgres = require('./loadPostgres.js');
const format = require('pg-format');
const CLI = require('../CLI.js');
const path = require('path');

const docs = `
Loads data from a proved CSV file into a postgres db.

Syntax: node ETL/postgres "path/to/csv" database_name table_name [-h|batch|end|auto|map|overerror|U|p|abort]
options:
batch #     Number of entries to enter as a batch
h           displays this help text
end #       ends the csv file read after # lines
auto 'val'  sets the name of the column that is auto-incremented (leave blank for none)
map 'name=newName,name2=newName2...'
            maps names from the csv file into different columns in the table
            use csvName=columnName format, separate multipleentries with commas
            use __skip__ to skip a column when importing
overerror   overwrites the error output file, if it exists
U        username to connect to postgres (not stored)
p        password to connect to postgres (not stored)
abort    abort on errors
silent   don't log normal progress to the console
`;

module.exports = async function main() {
  // ----------~~~~~~~~~~========== Values to persist between functions and read loop iterations ==========~~~~~~~~~~----------
  const startTime = new Date();
  const columnMask = [];

  let fieldNames;
  let inputFieldNames;
  let errorLines = 0;
  let writtenLines = 0;
  let batch = [];
  let client;

  // ----------~~~~~~~~~~========== Helper functions ==========~~~~~~~~~~----------
  function parseHeaders(line) {
    inputFieldNames = line;
    const fields = line.split(',');
    const mappedFields = fields
      .map((field, i) => {
        field = field.trim();
        const mappedField = args.map[field];
        if (mappedField === '__skip__') {
          columnMask[i] = false;
          return;
        }
        columnMask[i] = true;
        if (mappedField) return mappedField;
        return field;
      })
      .filter((field) => field);
    fieldNames = format('%s', mappedFields);
    CLI.log(args.silent, 'writing to fields:', fieldNames);
  }

  function parseLine(line) {
    const splitLine = line
      .split(/,+(?=(?:(?:[^"]*"){2})*[^"]*$)/g)
      .filter((entry, i) => columnMask[i])
      .map((entry) => {
        //trim quotes from strings
        entry.trim();
        if (entry.startsWith('"') && entry.endsWith('"')) {
          entry = entry.slice(1, entry.length - 1);
        }
        return entry;
      });
    return splitLine;
  }

  async function insertBatch() {
    const data = batch.map((line) => parseLine(line));
    const query = format(`insert into ${args.table} (${fieldNames}) values %L`, data);
    try {
      await client.query(query);
      writtenLines += batch.length;
    } catch (err) {
      //current batch failed to write
      if (args.abort) {
        //if the abort flag is set, crash with error
        throw err;
      }
      if (errorLines === 0) {
        //open up a new error file
        await new Promise((resolve, reject) => {
          fs.writeFile(errorFileName, inputFieldNames, (err) => {
            if (err) return reject(err);
            resolve();
          });
        });
      }
      //attempt to write the batch one at a time
      for (const line of batch) {
        const data = parseLine(line);
        const query = format(`insert into ${args.table} (${fieldNames}) values (%L)`, data);
        try {
          await client.query(query);
          writtenLines++;
        } catch (err) {
          //any individual lines that fail get written to an error CSV
          errorLines++;
          await new Promise((resolve, reject) => {
            fs.appendFile(errorFileName, `\n${line}`, (err) => {
              if (err) return reject(err);
              resolve();
            });
          });
        }
      }
    }
    batch = [];
  }

  // ----------~~~~~~~~~~========== Process command line arguments ==========~~~~~~~~~~----------
  const args = parseArgs(
    ['filePath', 'database', 'table'],
    ['overerror', 'abort', 'silent'],
    { end: 0, progress: 0, batch: 500, map: null, U: null, p: null },
    docs
  );
  args.end = parseInt(args.end);
  if (!args.map) args.map = {};
  else {
    const mapArray = args.map.split(',');
    args.map = {};
    for (const map of mapArray) {
      const [oldKey, newKey] = map.split('=');
      args.map[oldKey] = newKey;
    }
  }

  const errorFileName = `${args.table}_errorLines.csv`;

  if (!args.overerror) {
    await new Promise((resolve, reject) => {
      fs.readdir('./', (err, files) => {
        if (err) return reject(err);
        for (const file of files) {
          if (file === errorFileName) {
            const error = new Error(
              `error output file for this table already exists! Please delete or rename ${errorFileName} and try again.`
            );
            console.error(error);
            reject(error);
            process.exit();
          }
          resolve();
        }
      });
    });
  }

  args.filePath = path.join(__dirname, args.filePath);

  // ----------~~~~~~~~~~========== Command line interface ==========~~~~~~~~~~----------

  if (!args.U) args.U = await CLI.prompt('Postgres username: ');
  if (!args.p) args.p = await CLI.prompt('Postgres password: ', true);
  if (!args.database) args.database = await CLI('Postgres database name: ');
  if (!args.table) args.table = await CLI.prompt('table to import to: ');
  // ----------~~~~~~~~~~========== Connect to database ==========~~~~~~~~~~----------

  client = await postgres(args.database, args.U, args.p);

  // ----------~~~~~~~~~~========== Begin reading and importing ==========~~~~~~~~~~----------

  CLI.log(args.silent, `importing from ${args.filePath} to table ${args.table}`);
  const fileStream = fs.createReadStream(args.filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let lineNum = -1;

  //read the file
  for await (const line of rl) {
    lineNum++;
    if (lineNum && lineNum % 500 === 0) {
      //TODO: get filesize, compare to byte count, make an actual progress bar (or at least a percentage readout)
      CLI.progress(args.silent, `current line: ${lineNum}, errors: ${errorLines}`);
    }
    if (lineNum === 0) {
      parseHeaders(line);
    } else if (args.end > 0 && lineNum === args.end) {
      rl.close();
      fileStream.close();
    } else if (!args.end || lineNum < args.end) {
      batch.push(line);
      if (batch.length === args.batch) {
        await insertBatch();
      }
    }
  }

  //push the remaining values
  if (batch.length) {
    await insertBatch(true);
  }

  // ----------~~~~~~~~~~========== display statistics ==========~~~~~~~~~~----------

  CLI.log(
    args.silent,
    `
    write complete after ${(new Date() - startTime) / 1000} s
    lines written successfully: ${writtenLines}
    lines with errors:          ${errorLines}
    `
  );

  try {
    await client.end();
  } catch (err) {
    CLI.log(args.silent, 'database did not disconnect gracefully');
  }
};
