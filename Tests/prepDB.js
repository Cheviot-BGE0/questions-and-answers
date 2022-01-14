const { Client } = require('pg');
const config = require('./config.js');
config.database = config.database.toLowerCase();

module.exports = async function() {
  const setupClient = new Client({
    user: config.user,
    password: config.password,
  })
  await setupClient.connect();
  try {
    await setupClient.query(`create database ${config.database}`);
  } catch (err) {
    console.log('testdb already exists');
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