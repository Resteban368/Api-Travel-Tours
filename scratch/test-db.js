const { Client } = require('pg');

const databaseUrl = process.env.DATABASE_URL;

async function test() {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected successfully');
    const res = await client.query('SELECT * FROM info_empresa');
    console.log('Query result:', res.rows);
  } catch (err) {
    console.error('Connection error:', err.message);
  } finally {
    await client.end();
  }
}

test();
