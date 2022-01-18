const { Client } = require('pg');

async function postgres(host, database, user, password) {
  const client = new Client({
    host,
    user,
    database,
    password
  });
  await client.connect()
  return client;
}

module.exports = postgres;
