import parseArgs from '../parseArgs.js';
import fs from 'fs';
import readline from 'readline';
import client from './loadPostgres.js';
import format from 'pg-format';

const docs = `
Loads data from a proved CSV file into a postgres db.

Syntax: node ETL/postgres "path/to/csv" database_name [-h|end #]
options:
h          displays this help text
end #      ends the csv file read after # lines
overerror  overwrites the error output file, if it exists
`;

const args = parseArgs(['filePath', 'tableName'], ['overerror'], { end: 0, progress: 0 }, docs);
args.end = parseInt(args.end);

const stream = fs.createReadStream(args.filePath);
const rl = readline.createInterface({
  input: stream,
  crlfDelay: Infinity,
});
let lineNum = 0;
let fieldNames;
let errorLines = 0;
let writtenLines = 0;
const errorFileName = `${args.tableName}_errorLines`;

const parseLine = (line) => {
  return line.split(/,+(?=(?:(?:[^"]*"){2})*[^"]*$)/g);
};

if (!args.overerror) {
  await new Promise((resolve, reject) => {
    fs.readdir('./', (err, files) => {
      if (err) return reject(err);
      for (const file of files) {
        if (file === errorFileName) {
          reject(
            new Error(
              `error output file for this table already exists! Please delete or rename ${errorFileName} and try again.`
            )
          );
          process.exit();
        }
        resolve();
      }
    });
  });
}

const insertQuery = (line) => {
  const values = parseLine(line);
  let valuePlaceholders = [];
  for (let i = 0; i < values.length; i++) {
    valuePlaceholders.push(`$${i + 1}`);
  }
  valuePlaceholders = valuePlaceholders.join(', ');
  const query = `insert into ${args.tableName} (${fieldNames}) values (${valuePlaceholders})`;
  return client.query(query, values);
};

const incrementQuery = (id) => {
  const query = `select setval('public.${args.tableName}_id_seq', greatest( currval('public.${args.tableName}_id_seq'), ${id}) + 1)`;
  client.query(query);
};

//ensure nextval exists
await client.query(`select nextval('public.${args.tableName}_id_seq')`);

//read the file
for await (const line of rl) {
  //maintain current line number regardless of how many times it's incremented later
  lineNum++;
  const currentLine = lineNum - 1;
  if (args.progress && currentLine % 100000) {
    console.log('line ', currentLine);
  }

  if (currentLine === 0) {
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
  } else if (args.end > 0 && currentLine > args.end) {
    //TODO: close isn't enough to end the reading.
    rl.close();
    stream.close();
  } else {
    try {
      await insertQuery(line);
      await incrementQuery(currentLine);
      writtenLines++;
    } catch (err) {
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

console.log(
  `write complete.
  lines written successfully: ${writtenLines}
  lines with errors:          ${errorLines}`
);

//This is hacky, something isn't detaching right
process.exit();
