import parseArgs from '../parseArgs.js';
import fs from 'fs';
import readline from 'readline';
import client from './loadPostgres.js';
import format from 'pg-format';

const docs = `
Loads data from a proved CSV file into a postgres db.

Syntax: node ETL/postgres "path/to/csv" database_name [-h|e #]
options:
h     displays this help text
e #    ends the csv file read after # lines
`;

const args = parseArgs(['filePath', 'tableName'], [], { e: 0 }, docs);
args.e = parseInt(args.e);

const stream = fs.createReadStream(args.filePath);
const rl = readline.createInterface({
  input: stream,
  crlfDelay: Infinity,
});
let lineNum = 0;
let fieldNames;
let errorLines = 0;
let writtenLines = 0;

const parseLine = (line) => {
  return line.split(/,+(?=(?:(?:[^"]*"){2})*[^"]*$)/g);
};

const insertQuery = (line) => {
  const values = parseLine(line);
  let valuePlaceholders = [];
  for (let i = 0; i < values.length; i++) {
    valuePlaceholders.push(`$${i + 1}`);
  }
  valuePlaceholders = valuePlaceholders.join(', ');
  const query = `insert into ${args.tableName} (${fieldNames}) values (${valuePlaceholders})`;
  console.log('insert query: ', query);
  console.log('values: ', values.join(', '));
  return client.query(query, values);
};

const incrementQuery = (id) => {
  const query = `select setval('public.${args.tableName}_id_seq', greatest( currval('public.${args.tableName}_id_seq'), ${id}) + 1)`;
  console.log('increment query: ', query);
  client.query(query);
};

//ensure nextval exists
await client.query(`select nextval('public.${args.tableName}_id_seq')`);

//read the file
for await (const line of rl) {
  //maintain current line number regardless of how many times it's incremented later
  const currentLine = lineNum;
  lineNum++;
  if (currentLine === 0) {
    const fields = line.split(',');
    //TODO: format fields entries with pg-format to avoid sql injection
    fieldNames = fields.join(', ');
    //TODO: since this is all async, it feels like the following lines could potentially get ahead of this line
    console.log('reading data!');
  } else if (args.e > 0 && currentLine > args.e) {
    rl.close();
  } else {
    try {
      await insertQuery(line);
      await incrementQuery(currentLine);
      writtenLines++;
    } catch (err) {
      //TODO: store errored lines somewhere
      errorLines++;
      console.log(currentLine, line);
      console.error(err);
    }
  }
}

console.log(
  `write complete.
  lines written successfully: ${writtenLines}
  lines with errors:          ${errorLines}`
);
