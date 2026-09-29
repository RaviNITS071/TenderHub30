import pino from 'pino';
import { env } from '../config/env.js';

const logger = pino();

export const globalErrorHandler = (err, req, res, next) => {
  logger.error(err);

  const status = err.status || 500;
  const isProd = env.NODE_ENV === 'production';

  // Handle Mongoose unique constraint errors gracefully without leaking raw database keys
  if (err.code === 11000) {
    return res.status(409).json({ error: 'A record with this identifier already exists.' });
  }

  // Hide internal database or low-level error strings in production for 500 errors
  const safeMessage = (isProd && status >= 500)
    ? 'Internal server error. Please try again later.'
    : (err.message || 'Internal Server Error');

  res.status(status).json({
    error: safeMessage,
    ...(!isProd && { stack: err.stack })
  });
};