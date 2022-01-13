import parseArgs from '../parseArgs.js';
import fs from 'fs';
import readline from 'readline';
import client from './loadPostgres.js';
import format from 'pg-format';

const docs = `
Loads data from a proved CSV file into a postgres db.

Syntax: node ETL/postgres "path/to/csv" database_name [-h|end #]
options:
batch #    Number of entries to enter as a batch
h          displays this help text
end #      ends the csv file read after # lines
overerror  overwrites the error output file, if it exists
`;

const args = parseArgs(
  ['filePath', 'tableName'],
  ['overerror'],
  { end: 0, progress: 0, batch: 500 },
  docs
);
args.end = parseInt(args.end);


let fieldNames;
let errorLines = 0;
let writtenLines = 0;
const errorFileName = `${args.tableName}_errorLines.csv`;
const startTime = new Date();
let batch = [];

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

const parseLine = (line) => {
  return line.split(/,+(?=(?:(?:[^"]*"){2})*[^"]*$)/g);
};

const insertBatch = () => {
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
  const query = `insert into ${args.tableName} (${fieldNames}) values ${valuePlaceholders}`;
  return client.query(query, values);
};

const incrementQuery = (id) => {
  const query = `select setval('public.${args.tableName}_id_seq', greatest( currval('public.${args.tableName}_id_seq'), ${id}) + 1)`;
  client.query(query);
};

//ensure nextval exists
await client.query(`select nextval('public.${args.tableName}_id_seq')`);

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
    const fields = line.split(',');
    //TODO: format fields entries with pg-format to avoid sql injection
    fieldNames = fields.join(', ');
    console.log('assigned fieldNames to ', fields.join(', '));
    await new Promise((resolve, reject) => {
      fs.writeFile(errorFileName, line, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  } else if (args.end > 0 && lineNum === args.end) {
    rl.close();
    fileStream.close();
  } else if (!args.end || lineNum < args.end) {

    batch.push(line);
    try {
      if (batch.length === args.batch) {
        await insertBatch();
        batch = [];
        writtenLines += args.batch;
      }
    } catch (err) {
      errorLines += args.batch;

      await new Promise((resolve, reject) => {
        fs.appendFile(errorFileName, `\n${batch.join('\n')}`, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
      batch = [];
    }
  }
}

try{
  await incrementQuery(lineNum)
} catch(err) {
  console.error('entries were written, but auto-increment id was unable to be updated!')
}


console.log(
  `
  write complete after ${(new Date() - startTime) / 1000} s
  lines written successfully: ${writtenLines}
  lines with errors:          ${errorLines}`
);

//This is hacky, something isn't detaching right
process.exit();
