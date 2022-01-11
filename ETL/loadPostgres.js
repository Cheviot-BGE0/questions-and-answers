const { Client } = require('pg');
const client = new Client();
await client.connect()

const res = client.query('')
