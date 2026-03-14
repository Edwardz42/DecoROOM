function notFoundHandler(req, res, next) {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} does not exist`
  });
}

function errorHandler(error, req, res, next) {
  const status = error.status || 500;
  res.status(status).json({
    error: error.name || 'Error',
    message: error.message || 'Internal server error'
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};