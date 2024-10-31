require('dotenv').config();
const jwt = require('jsonwebtoken');
const logger = require('./logger');
const redisClient = require('./redisClient');
const { rateLimit } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    const error = new Error('Token is required')
    error.status = 401
    return next(error)
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      const error = new Error('Forbidden')
      error.status = 403
      return next(error)
    }
    req.user = user;
    next();
  });
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      const error = new Error('Access denied')
      error.status = 403
      return next(error)
    }
    next();
  };
};

const asyncWrapper = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const successfulResHandler = (req, res, next) => {
  const { method, originalUrl, ip } = req;
  const user = req.user ? req.user.id : 'Guest';
  const { startTime, statusCode, resData } = res.locals;

  const reqLog = {
    req_created_at: res.locals.startTime,
    method,
    url: originalUrl,
    ip,
    user,
  }

  res.status(statusCode).json(resData);

  res.on('finish', () => {
    logger.info('Request completed', {
      req: reqLog,
      statusCode: res.statusCode,
      duration: Date.now() - startTime,
    });
  });
};

const errorHandler = (err, req, res, next) => {

  const { method, originalUrl, ip } = req;
  const user = req.user ? req.user.id : 'Guest';
  const status = err.status ?? 500

  const reqLog = {
    req_created_at: res.locals.startTime,
    method,
    url: originalUrl,
    ip,
    user,
  }

  res.status(status).json({
    message: status === 500 ? 'Internal Server Error' : err.message,
  });

  res.on('finish', () => {
    logger.error('Error during request', {
      req: reqLog,
      statusCode: err.status ?? 500,
      duration: Date.now() - res.locals.startTime,
      error: err.message
    });
  });
}

const shortTermLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 failed login requests per window
  handler: (req, res, next) => {
    const err = new Error('Too many failed Login Attempts. Please try again in a minute')
    err.status = 429
    next(err)
  },
  requestWasSuccessful: (request, response) => process.env.NODE_ENV === 'test' || response.statusCode < 400,
  skipSuccessfulRequests: true,
});

const longTermLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 10 failed login requests per window
  handler: (req, res, next) => {
    const err = new Error('Too many failed Login Attempts. Please try again later.')
    err.status = 429
    next(err)
  },
  requestWasSuccessful: (request, response) => process.env.NODE_ENV === 'test' || response.statusCode < 400,
  skipSuccessfulRequests: true,
});

const rateLimiter = [
  shortTermLimiter,
  longTermLimiter,
]

module.exports = {
  verifyToken, 
  authorizeRoles,
  asyncWrapper,
  successfulResHandler,
  errorHandler,
  rateLimiter,
};
