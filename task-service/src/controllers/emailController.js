const Task = require("../models/task");
const { sendTaskToQueue } = require("../utils/functions");

async function createEmail (req, res, next) {
  const { email, subject, content } = req.body;

  const task = await Task.create({
    name: "weekly-advertisement-email",
    metadata: { email, subject, content },
  });

  await sendTaskToQueue('email', {
    taskId: task._id,
    email,
    subject,
    content,
  });

  res.locals = {
    ...res.locals,
    resData: { message: 'Email task scheduled', task },
    statusCode: 201
  };
  next();
}

module.exports = {
  createEmail
}