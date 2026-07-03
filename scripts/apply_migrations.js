const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations');
const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || process.env.SUPABASE_DATABASE_URL || process.env.SUPABASE_URL;

if (!DATABASE_URL) {
  console.error('ERROR: No database connection string found. Set DATABASE_URL or SUPABASE_DB_URL in env.');
  process.exit(1);
}

async function run() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.log('No migrations directory found at', MIGRATIONS_DIR);
    return;
  }

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('No .sql files found in', MIGRATIONS_DIR);
    return;
  }

  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  for (const file of files) {
    const fullPath = path.join(MIGRATIONS_DIR, file);
    console.log('Applying migration:', file);
    const sql = fs.readFileSync(fullPath, 'utf8');
    try {
      await client.query(sql);
      console.log('Applied:', file);
    } catch (err) {
      console.error('Failed to apply', file, '\n', err.message || err);
      await client.end();
      process.exit(1);
    }
  }

  await client.end();
  console.log('All migrations applied successfully.');
}

run().catch(err => {
  console.error('Migration runner failed:', err);
  process.exit(1);
});
