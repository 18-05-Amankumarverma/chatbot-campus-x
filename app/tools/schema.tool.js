const { tool } = require('@langchain/core/tools');
const { z } = require('zod');
const { formatSchema } = require('../services/schema.service');

const schemaTool = tool(({ tables }) => formatSchema(tables), {
  name: 'get_database_schema',
  description: 'Retrieve concise descriptions, columns and join keys for database tables before writing SQL.',
  schema: z.object({
    tables: z.array(z.string()).optional().describe('Known table names to inspect; omit for all tables.'),
  }),
});

module.exports = { schemaTool };
