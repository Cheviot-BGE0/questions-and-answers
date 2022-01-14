const { Client } = require('pg');
const config = require('./config.js');
config.database = config.database.toLowerCase();

module.exports = async function() {
  const setupClient = new Client({
    user: config.user,
    password: config.password,
  })
  await setupClient.connect();
  const dbExists = await setupClient.query(`SELECT datname FROM pg_catalog.pg_database WHERE datname='${config.database}'`)
  if (!dbExists.rows.length) {
    await setupClient.query(`create database ${config.database}`);
  }
  setupClient.end();

  const returnClient = new Client({
    database: config.database,
    user: config.user,
    password: config.password,
  });
  await returnClient.connect();
  return returnClient;
}