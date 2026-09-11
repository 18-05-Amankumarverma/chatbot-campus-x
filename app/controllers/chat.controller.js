const { chat } = require('../services/chat.service');

async function postChat(req, res, next) {
  try {
    const { message } = req.body || {};
    if (typeof message !== 'string' || !message.trim()) {
      const error = new Error('"message" must be a non-empty string.');
      error.statusCode = 400;
      error.code = 'INVALID_REQUEST';
      throw error;
    }
    if (message.length > 2_000) {
      const error = new Error('"message" must not exceed 2000 characters.');
      error.statusCode = 400;
      error.code = 'INVALID_REQUEST';
      throw error;
    }

    const result = await chat(message);
    res.json({
      success: true,
      answer: result.answer,
      data: result.data,
      metadata: { tablesUsed: result.tablesUsed },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { postChat };
