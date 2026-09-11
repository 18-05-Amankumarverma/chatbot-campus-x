function logger(req, res, next) {
  const started = Date.now();
  res.on('finish', () => {
    console.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - started}ms`);
  });
  next();
}

module.exports = { logger };
