import parseArgs from '../parseArgs.js';
import fs from 'fs';
import readline from 'readline';
import postgres from './loadPostgres.js';
import format from 'pg-format';
import CLI from '../CLI.js';

//argument for server, username, password
//TODO: prompt to input username, password
//currently command looks like:
//node ETL/postgres -U <username> -p <password> ../../SDC\ Data/questions.csv questionsAndAnswers test
//TODO: delete errors file if no errors

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
`;

// ----------~~~~~~~~~~========== Process command line arguments ==========~~~~~~~~~~----------

const args = parseArgs(
  ['filePath', 'database', 'table'],
  ['overerror', 'abort'],
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

// ----------~~~~~~~~~~========== Command line interface ==========~~~~~~~~~~----------

if (!args.U) args.U = await CLI('Postgres username: ');
if (!args.p) args.p = await CLI('Postgres password: ');
if (!args.database) args.database = await CLI('Postgres database name: ');
if (!args.table) args.table = await CLI('table to import to: ');

// ----------~~~~~~~~~~========== Values to persist between read loop iterations ==========~~~~~~~~~~----------

const startTime = new Date();
const columnMask = [];

let fieldNames;
let inputFieldNames;
let errorLines = 0;
let writtenLines = 0;
let batch = [];

// ----------~~~~~~~~~~========== Helper functions ==========~~~~~~~~~~----------

function parseHeaders (line) {
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
  //TODO: format fields entries with pg-format to avoid sql injection
  fieldNames = mappedFields.join(', ');
  console.log('writing to fields:', fieldNames);
}

function parseLine (line) {
  const splitLine = line.split(/,+(?=(?:(?:[^"]*"){2})*[^"]*$)/g);
  return splitLine.filter((entry, i) => columnMask[i]);
}

async function insertBatch() {
  try {
    let placeholderPlace = 1;
    let valuePlaceholders = [];
    const values = [];
    batch.forEach((line) => {
      const linePlaceholders = [];
      const parsed = parseLine(line);
      parsed.forEach((value) => {
        values.push(value);
        linePlaceholders.push(`$${placeholderPlace++}`);
      });
      valuePlaceholders.push(`\n(${linePlaceholders.join(', ')})`);
      return;
    });
    const query = `insert into ${args.table} (${fieldNames}) values ${valuePlaceholders}`;
    await client.query(query, values);
    writtenLines += batch.length;
    batch = [];
  } catch (err) {
    if (args.abort) {
      throw err;
    }
    if (errorLines === 0) {
      await new Promise((resolve, reject) => {
        fs.writeFile(errorFileName, inputFieldNames, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    }
    errorLines += batch.length;
    await new Promise((resolve, reject) => {
      fs.appendFile(errorFileName, `\n${batch.join('\n')}`, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    batch = [];
  }
}

// ----------~~~~~~~~~~========== Connect to database ==========~~~~~~~~~~----------

const client = await postgres(args.database, args.U, args.p);

// ----------~~~~~~~~~~========== Begin reading and importing ==========~~~~~~~~~~----------

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
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`current line: ${lineNum}, errors: ${errorLines}`);
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
  await insertBatch(true)
}

// ----------~~~~~~~~~~========== display statistics ==========~~~~~~~~~~----------

console.log(
  `
  write complete after ${(new Date() - startTime) / 1000} s
  lines written successfully: ${writtenLines}
  lines with errors:          ${errorLines}`
);

try {
  //process.exit();
  await client.end();
} catch(err) {
  console.log('database did not disconnect gracefully')
}

//this throws an error even when it's called after all the data is done writing successfully
