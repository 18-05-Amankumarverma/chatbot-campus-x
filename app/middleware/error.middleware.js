function notFound(req, res) {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found.' } });
}

function errorHandler(error, req, res, next) { // eslint-disable-line no-unused-vars
  const status = error.statusCode || (error.code === 'ECONNREFUSED' ? 503 : 500);
  if (status >= 500) console.error('Request failed:', error.message);

  res.status(status).json({
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: status >= 500 && process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred.'
        : error.message || 'An unexpected error occurred.',
    },
  });
}

module.exports = { notFound, errorHandler };
