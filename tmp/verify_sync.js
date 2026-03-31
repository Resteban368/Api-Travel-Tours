const { Client } = require('pg');
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function check() {
  await client.connect();
  const res = await client.query("SELECT metadata->>'tipo' as tipo, text FROM n8n_vectors WHERE metadata->>'tipo' = 'consolidado_politicas_reserva'");
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}

check().catch(console.error);
