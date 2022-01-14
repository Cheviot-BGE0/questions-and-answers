const originalArgv = process.argv;
const { Client } = require('pg');
let client;
const config = require('./config.js');
const fs = require('fs');

describe('Postgres ETL', () => {
  beforeAll(async function () {
    client = new Client({
      database: config.database,
      username: config.username,
      password: config.password,
    });
    await client.connect();
  });
  beforeEach(async function () {
    await client.query('drop table if exists test');
    await client.query(`create table test(
      id int generated by default as identity,
      product_id int,
      written date,
      asker_name varchar(60),
      asker_email varchar(60),
      helpful int,
      reported int,
      primary key(id)
    )`);
    if (fs.existsSync('test_errorLines.csv')) {
      fs.rmSync('./test_errorLines.csv');
    }
  });
  afterAll(async function() {
    process.argv = originalArgv;
    await client.end();
  });
  it('should load valid data into the database', async function () {
    //TODO: maybe just stub out parseArgs instead
    process.argv = [
      'fakepath',
      'fakepath2',
      '-U',
      config.username,
      '-p',
      config.password,
      './dummyData/dummy.csv',
      config.database,
      'test',
      'map',
      'date_written=written,asker_email=__skip__'
    ];
    require('../ETL/postgres');
    //check if database has the right number of entries
    const lineCount = await client.query('select count(*) from test');
    expect(lineCount).toBe(518);

    //check a sample of the entries for specific column data
    const firstLine = await client.query('select * from test where id=1');
    expect(firstLine).toEqual([1,1,"What fabric is the top made of?","2018-01-04","yankeelover",0,1])

    //check that there's no error file
    expect(fs.existsSync('test_errorLines.csv')).toEqual(false);
  });
  xit('should create a csv file with errored lines when lines cause errors', async function (done) {
    process.argv = [
      'fakepath',
      'fakepath2',
      '-U',
      config.username,
      '-p',
      config.password,
      './dummyData/dummy.csv',
      config.database,
      'test',
    ];
    require('../ETL/postgres');

    done();
  });
});
