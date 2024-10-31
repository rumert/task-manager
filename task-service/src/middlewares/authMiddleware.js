require('dotenv').config();
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  if (req.path === '/metrics') {
    return next();
  }
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

module.exports = {
  verifyToken, 
  authorizeRoles
};
