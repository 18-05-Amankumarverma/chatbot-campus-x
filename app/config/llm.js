const { ChatGroq } = require('@langchain/groq');

function getLlm() {
  if (!process.env.GROQ_API_KEY) {
    const error = new Error('GROQ_API_KEY is not configured.');
    error.statusCode = 503;
    error.code = 'LLM_NOT_CONFIGURED';
    throw error;
  }

  const configuredModel = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
  // Groq removed this model for free and developer-tier accounts in August 2026.
  const model = configuredModel === 'llama-3.3-70b-versatile'
    ? 'openai/gpt-oss-20b'
    : configuredModel;

  if (model !== configuredModel) {
    console.warn('GROQ_MODEL llama-3.3-70b-versatile is deprecated; using openai/gpt-oss-20b instead.');
  }

  return new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model,
    temperature: 0,
    streaming: false,
    maxRetries: 2,
  });
}

module.exports = { getLlm };
