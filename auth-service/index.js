const express = require('express');
const routes = require('./routes');
const { successfulResHandler, errorHandler } = require('./middlewares');

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.locals.startTime = Date.now()
  next();
});
app.use('/', routes);
app.use(successfulResHandler);
app.use(errorHandler);

app.listen(4001, () => {
  console.log('Auth service listening on port 4001');
});