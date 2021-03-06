const parseArgs = require('../../utils/parseArgs.js');
const fs = require('fs');
const readline = require('readline');
const postgres = require('./loadPostgres.js');
const format = require('pg-format');
const CLI = require('../../utils/CLI.js');
const path = require('path');
const config = require('../../config.js');

const docs = `
Loads data from a provided CSV file into a postgres db.

Syntax: node ETL/postgres "path/to/csv" table_name [-h|batch|end|map|overerror|abort]
options:
h           displays this help text
batch #     Number of entries to load per batch
end #       ends the csv file read after # lines
map 'name=newName,name2=newName2...'
            maps names from the csv file into different columns in the table
            use csvName=columnName format, separate multiple entries with commas
            use __skip__ to ignore a column when importing
overerror   automatically overwrites the error output file, if it exists
abort       abort on errors
silent      don't print progress to console
`;

module.exports = async function main() {
  // ----------~~~~~~~~~~========== Scope variables ==========~~~~~~~~~~----------
  const startTime = new Date();
  const columnMask = [];
  let fieldNames;
  let inputFieldNames;
  let errorLines = 0;
  let writtenLines = 0;
  let batch = [];
  let client;
  let fileSize;
  let bytesRead = 0;

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
    CLI.log(args.silent, `writing to fields: ${fieldNames}\n`);
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

  // ----------~~~~~~~~~~========== Process arguments ==========~~~~~~~~~~----------
  const args = parseArgs(
    ['filePath', 'table'],
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
  args.filePath = path.join(__dirname, '../../', args.filePath);

  if (!args.table) args.table = await CLI.prompt('table to import to: ');

  // ----------~~~~~~~~~~========== Connect to database ==========~~~~~~~~~~----------
  client = await postgres(config.host, config.database, config.user, config.password);

  // ----------~~~~~~~~~~========== Begin reading and importing ==========~~~~~~~~~~----------
  CLI.log(args.silent, `\nimporting from ${args.filePath} to table ${args.table}`);
  fileSize = fs.statSync(args.filePath).size;
  const fileStream = fs.createReadStream(args.filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let lineNum = -1;

  //read the file
  for await (const line of rl) {
    lineNum++;
    bytesRead += line.length;
    if (lineNum && lineNum % 1000 === 0) {
      CLI.progress(args.silent, fileSize, bytesRead, lineNum, errorLines);
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
    CLI.progress(args.silent, fileSize, bytesRead, lineNum, errorLines)
  }

  // ----------~~~~~~~~~~========== final statistics ==========~~~~~~~~~~----------
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
