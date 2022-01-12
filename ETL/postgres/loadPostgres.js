import { Client } from 'pg';

module.exports = new Client();
await Client.connect()

const res = Client.query('')

