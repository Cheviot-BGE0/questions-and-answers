import parseArgs from '../parseArgs.js';
import fs from 'fs';
import readline from 'readline';

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
for await (const line of rl) {
  if (args.e > 0 && lineNum >= args.e){
    rl.close();
  } else {
    console.log(lineNum, line)
  }
  lineNum++;
}
