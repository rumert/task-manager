require('dotenv').config();
const redisClient = require('../utils/redisClient');
const { rateLimit } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis')

function creteRateLimiter(windowSec, max, errMsg) {
    return rateLimit({
        store: new RedisStore({
            sendCommand: (...args) => redisClient.call(...args),
        }),
        windowMs: windowSec * 1000,
        max,
        handler: (req, res, next) => {
          const err = new Error(errMsg)
          err.status = 429
          next(err)
        },
        requestWasSuccessful: (request, response) => process.env.NODE_ENV === 'test' || response.statusCode < 400,
        skipSuccessfulRequests: true,
    });
}

const lightRateLimiter = creteRateLimiter(60, 200, 'Too many requests. Please try again in a minute');
const normalRateLimiter = creteRateLimiter(60, 100, 'Too many requests. Please try again in a minute');
const strongRateLimiter = creteRateLimiter(60, 20, 'Too many requests. Please try again in a minute');

module.exports = {
    lightRateLimiter,
    normalRateLimiter,
    strongRateLimiter
};