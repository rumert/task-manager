const amqp = require('amqplib');
const redisClient = require("./redisClient");

async function sendTaskToQueue (queue, task) {
  const connection = await amqp.connect('amqp://rabbitmq');
  const channel = await connection.createChannel();

  const message = JSON.stringify(task);

  await channel.assertQueue(queue, {
    durable: true,
  });

  channel.sendToQueue(queue, Buffer.from(message), { persistent: true });
  console.log(' [x] Sent %s', message);

  setTimeout(() => {
    connection.close();
  }, 500);
};

const asyncWrapper = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

async function getDataWithCache(cacheKey, cb, expiration = 3600) {
  const data = await redisClient.get(cacheKey)
  if (data != null) {
    return JSON.parse(data)
  }
  const freshData = await cb()
  await redisClient.set(cacheKey, JSON.stringify(freshData), 'EX', expiration)
  return freshData
}

async function invalidateCaches(pattern) {
  const keys = await redisClient.keys(pattern);
  await Promise.all(keys?.map(key => redisClient.del(key)));
}

module.exports = {
  sendTaskToQueue,
  asyncWrapper,
  getDataWithCache,
  invalidateCaches,
}