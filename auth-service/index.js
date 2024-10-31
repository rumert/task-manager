require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
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

async function connectWithRetry(connectFunc, retries = 5, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      await connectFunc();
      console.log('Connection successful');
      return;
    } catch (error) {
      console.error(`Connection failed. Attempt ${i + 1} of ${retries}:`, error.message);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  console.error('Max retries reached. Exiting...');
  process.exit(1);
}

async function connectToMongoDB() {
  await connectWithRetry(async () => {
    await mongoose.connect(process.env.MONGO_URL);
  });
}

connectToMongoDB()

app.listen(4001, () => {
  console.log('Auth service listening on port 4001');
});