require('dotenv').config();
const express = require("express");
const { asyncWrapper } = require("../utils/functions");
const prometheusClient = require('../utils/metrics');
const { normalRateLimiter } = require('../middlewares/rate-limiter');
const basicAuth = require('express-basic-auth');

const router = express.Router();

router.get('/', normalRateLimiter, basicAuth({
    users: { 'prometheus': process.env.PROMETHEUS_PASSWORD }
}), asyncWrapper(async (req, res) => {
    res.set('Content-Type', prometheusClient.register.contentType);
    res.end(await prometheusClient.register.metrics());
}));

module.exports = router;