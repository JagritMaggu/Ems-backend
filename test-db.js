const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.rjsstlygocwteaytvnnk:r080601j210900@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true'
});
client.connect()
  .then(() => console.log('Connected successfully'))
  .catch(err => console.error('Connection error', err.message))
  .finally(() => client.end());
