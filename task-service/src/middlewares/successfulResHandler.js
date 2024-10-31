const logger = require("../utils/logger");

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

module.exports = successfulResHandler;