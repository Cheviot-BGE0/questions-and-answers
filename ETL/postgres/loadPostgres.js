const { Client } = require('pg');

async function postgres(database, user, password) {
  const client = new Client({
    user,
    database,
    password
  });
  await client.connect()
  return client;
}

module.exports = postgres;
