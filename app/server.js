require('dotenv').config();

const app = require('./app');
const port = Number(process.env.PORT || 5000);
const server = app.listen(port, () => console.info(`AI database chatbot listening on port ${port}`));

function shutdown() {
  server.close(() => process.exit(0));
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
