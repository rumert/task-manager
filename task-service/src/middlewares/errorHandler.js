const logger = require("../utils/logger");

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

module.exports = errorHandler;