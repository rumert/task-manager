require('dotenv').config();
const amqp = require('amqplib');
const axios = require('axios');
const logger = require('./logger');

async function startListening() {
  try {
    const connection = await connectWithRetry(async () => await amqp.connect('amqp://rabbitmq'));
    const channel = await connection.createChannel();

    const queue = 'email';

    await channel.assertQueue(queue, {
      durable: true,
    });

    console.log(' [*] Waiting for messages in %s. To exit press CTRL+C', queue);

    await channel.consume(queue, async (msg) => {
      try {
        const token = await login();
        const task = JSON.parse(msg.content.toString());

        await assignWorker(token, process.env.WORKER_ID, task.taskId)
        await sendEmail(task);

        channel.ack(msg);
        await markTaskAsCompleted(task.taskId, token);
        logger.info('task executed successfully!', { workerId: process.env.WORKER_ID, taskId: task.taskId });
      } catch (error) {
        logger.error('Error processing task', { message: error.message, stack: error.stack, workerId: process.env.WORKER_ID, task: msg.content.toString() });
        channel.nack(msg);
      }
    }, { noAck: false });
  } catch (error) {
    logger.error('Critical error in task-executor', { message: error.message, stack: error.stack });
    process.exit(1);
  }
}

startListening();

async function connectWithRetry(connectFunc, retries = 5, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await connectFunc();
    } catch (error) {
      await new Promise(res => setTimeout(res, delay));
    }
  }
  logger.error('Unable to connect to RabbitMQ after maximum attempts');
  process.exit(1);
}

async function login () {
  try {
    const { data: { token } } = await axios.post(`${process.env.AUTH_API}/login`, {
      username: process.env.WORKER_USERNAME,
      password: process.env.WORKER_PASSWORD
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return token;
  } catch (error) {
    logger.error('Error logging in', { message: error.message, stack: error.stack, taskId, workerId });
    process.exit(1);
  }
}

async function assignWorker (token, workerId, taskId) {
  try {
    await axios.put(`${process.env.TASK_SERVICE_API}/task/${taskId}/assign-worker/${workerId}`, undefined, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  } catch (error) {
    logger.error('Error assigning worker', { message: error.message, stack: error.stack, workerId: process.env.WORKER_ID });
    process.exit(1);
  }
}

async function sendEmail(task) {
  try {
    return new Promise((resolve) => setTimeout(resolve, 1000)); // Mock 1 second delay
  } catch (error) {
    logger.error('Error sending email', { message: error.message, stack: error.stack, taskId: task.taskId, workerId: process.env.WORKER_ID });
    process.exit(1);
  }
}

async function markTaskAsCompleted(taskId, token) {
  try {
    await axios.put(`${process.env.TASK_SERVICE_API}/task/${taskId}/complete`, undefined, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  } catch (error) {
    logger.error('Error marking task as completed', { message: error.message, stack: error.stack, taskId, workerId: process.env.WORKER_ID });
    process.exit(1);
  }
}

