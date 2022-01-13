import pg from 'pg';
const { Client } = pg;


async function postgres(database, user, password) {
  const client = new Client({
    user,
    database,
    password
  });
  await client.connect()
  return client;
}


export default postgres;
