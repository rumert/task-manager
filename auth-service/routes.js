require('dotenv').config();
const express = require("express");
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const { verifyToken, authorizeRoles, asyncWrapper, rateLimiter } = require("./middlewares");
const prometheusClient = require('./metrics');
const basicAuth = require('express-basic-auth');

const UserSchema = new mongoose.Schema({
    username: {
      type: String,
      unique: true,
    },
    password: String,
    role: {
      type: String,
      enum: ['Admin', 'Manager', 'Worker', 'PrometheusRole'],
    },
});
  
const User = mongoose.model('User', UserSchema);

router.post('/user', verifyToken, authorizeRoles('Admin'), asyncWrapper(async (req, res, next) => {
  const { username, password, role } = req.body;
  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(password, salt);
  const user = new User({ 
    username, 
    password: hashedPassword, 
    role
  });
  await user.save();
  res.locals = {
    ...res.locals,
    resData: 'OK',
    statusCode: 201
  };
  next();
}));

router.post('/login', rateLimiter, asyncWrapper(async (req, res, next) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username: username });
  if (!user || !(bcrypt.compare(password, user.password))) {
    const error = new Error('Invalid credentials')
    error.status = 401
    return next(error)
  }
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  res.locals = {
    ...res.locals,
    resData: { token },
    statusCode: 200
  };
  next();
}));

router.get('/metrics', basicAuth({
  users: { 'prometheus': process.env.PROMETHEUS_PASSWORD }
}), asyncWrapper(async (req, res) => {
  res.set('Content-Type', prometheusClient.register.contentType);
  res.end(await prometheusClient.register.metrics());
}));

module.exports = router;