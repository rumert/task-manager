const express = require('express');
const { verifyToken } = require('./middlewares/authMiddleware');
const taskRoutes = require('./routes/taskRoutes');
const emailRoutes = require('./routes/emailRoutes');
const prometheusRoutes = require('./routes/prometheusRoutes');
const successfulResHandler = require('./middlewares/successfulResHandler');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.locals.startTime = Date.now()
  next();
});
app.use(verifyToken);
app.use('/', taskRoutes);
app.use('/email', emailRoutes);
app.use('/metrics', prometheusRoutes)
app.use(successfulResHandler);
app.use(errorHandler);

module.exports = {
  app
}
