const { Client } = require('pg');

async function postgres(address, database, user, password) {
  const client = new Client({
    address,
    user,
    database,
    password
  });
  await client.connect()
  return client;
}

module.exports = postgres;
