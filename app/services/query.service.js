const { pool, ensureDatabaseUrl } = require('../config/databases');
const { validateSql } = require('../utils/sql.validator');

const QUERY_TIMEOUT = Math.max(1000, Number(process.env.QUERY_TIMEOUT_MS || 8000));

async function executeReadOnlyQuery(sql, values = []) {
  ensureDatabaseUrl();
  const safeSql = validateSql(sql);
  const client = await pool.connect();

  try {
    await client.query('BEGIN READ ONLY');
    await client.query(`SET LOCAL statement_timeout = '${QUERY_TIMEOUT}ms'`);

    const result = await client.query({ text: safeSql, values, rowMode: 'object' });
    await client.query('COMMIT');

    return { rows: result.rows, rowCount: result.rowCount, sql: safeSql };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});

    if (error.code === '57014') {
      error.statusCode = 408;
      error.code = 'QUERY_TIMEOUT';
      error.message = 'The database query timed out.';
    }
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { executeReadOnlyQuery };
