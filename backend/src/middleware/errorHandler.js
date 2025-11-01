/**
 * Global error handler middleware
 */
export function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Database errors
  if (err.code === '23505') { // Unique violation
    return res.status(409).json({ error: 'Resource already exists' });
  }

  if (err.code === '23503') { // Foreign key violation
    return res.status(400).json({ error: 'Invalid reference' });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

