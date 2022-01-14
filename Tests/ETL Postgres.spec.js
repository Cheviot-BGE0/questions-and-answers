const originalArgv = process.argv;
const { Client } = require('pg');

describe('Postgres ETL', () => {
  beforeAll(() => {
    //connect to postgres
  })
  beforeEach(() => {
    //drop and remake table
    //delete error data file (if it exists)
  });
  afterAll(() => {
    process.argv = originalArgv;
  });
  it('should load valid data into the database', (done) => {
    //TODO: maybe just stub out parseArgs instead
    process.argv = [
      'fakepath',
      'fakepath2',
      '-U',
      'postgres',
      '-p',
      require('./config.js').password,
      './dummyData/dummy.csv',
      'testDB',
      'test',
    ];
    require('../ETL/postgres');
    //check if database has the right number of entries
    //check that there's no error file
    //check a sample of the entries for specific column data
    expect(true).toBe(false);
  });
});
