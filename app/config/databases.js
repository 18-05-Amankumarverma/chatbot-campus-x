const { Pool } = require('pg');

const useSsl = process.env.DATABASE_SSL !== 'false';
const connectionTimeoutMillis = Math.max(
  5_000,
  Number(process.env.DATABASE_CONNECTION_TIMEOUT_MS || 20_000),
);

function ensureDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    const error = new Error('DATABASE_URL is not configured. Add your Neon pooled connection string to .env.');
    error.code = 'DATABASE_NOT_CONFIGURED';
    error.statusCode = 503;
    throw error;
  }
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Neon requires TLS for connections, including from local development.
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis,
  application_name: 'ai-database-chatbot',
  // Avoid IPv6-only routing failures on local Windows networks.
  family: 4,
});

pool.on('error', (error) => {
  console.error('Unexpected idle PostgreSQL client error:', error.message);
});

module.exports = { pool, ensureDatabaseUrl };
