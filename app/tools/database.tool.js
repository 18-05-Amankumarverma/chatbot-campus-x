const { schemaTool } = require('./schema.tool');
const { sqlTool } = require('./sql.tool');

module.exports = { databaseTools: [schemaTool, sqlTool] };
