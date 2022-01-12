import parseArgs from '../parseArgs.js';

const docs = `
Loads data from a proved CSV file into a postgres db.

Syntax: node ETL/postgres "path/to/csv" database_name [-h|e #]
options:
h     displays this help text
e     ends the csv file read after # lines
`

console.log(parseArgs(['filePath', 'tableName'], [], {'e': 0}, docs))
