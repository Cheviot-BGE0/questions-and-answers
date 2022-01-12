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
  if (lineNum === 0) {
    //TODO: parse line into field names
    //TODO: this is all async, it feels like the following lines could potentially get ahead of this line
    console.log('reading data!')
  } else if (args.e > 0 && lineNum > args.e){
    rl.close();
  } else {
    //TODO: using field names from top of file, fill entry in table
    console.log(lineNum, line)
  }
  lineNum++;
}
