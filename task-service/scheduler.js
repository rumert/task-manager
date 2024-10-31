require('dotenv').config();
const cron = require('node-cron');
const axios = require('axios');
const logger = require('./src/utils/logger');

// Schedule the task to run every Monday at 9 AM
cron.schedule('0 9 * * 1', async () => {
  const startTime = Date.now();
  const emailData = {
    email: 'example@email.com',
    subject: 'email subject',
    content: 'This is email content!',
  };

  try {
    const { data: { token } } = await axios.post(`${process.env.AUTH_API}/login`, {
      username: process.env.MANAGER_USERNAME,
      password: process.env.MANAGER_PASSWORD
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    await axios.post(`${process.env.TASK_SERVICE_API}/email`, emailData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    logger.info('Weekly email task scheduled successfully', {
      user: process.env.MANAGER_USERNAME,
      emailData,
      duration: Date.now() - startTime,
    });
  } catch (error) {
    logger.error('Failed to schedule weekly email task', {
      user: process.env.MANAGER_USERNAME,
      emailData,
      duration: Date.now() - startTime,
      error: error.message
    });
  }
});
