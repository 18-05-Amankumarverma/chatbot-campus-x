const { tool } = require('@langchain/core/tools');
const { z } = require('zod');
const { executeReadOnlyQuery } = require('../services/query.service');

const sqlTool = tool(
  async ({ sql }) => JSON.stringify(await executeReadOnlyQuery(sql)),
  {
    name: 'execute_read_only_sql',
    description: 'Execute one validated PostgreSQL SELECT or read-only CTE query. Never use mutations.',
    schema: z.object({ sql: z.string().min(1) }),
  },
);

module.exports = { sqlTool };
