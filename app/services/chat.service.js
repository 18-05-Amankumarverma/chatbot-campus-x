const { askDatabase } = require('../agents/database.agents');

async function chat(message) {
  return askDatabase(message.trim());
}

module.exports = { chat };
