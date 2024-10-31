const Task = require("../models/task");
const { getDataWithCache, invalidateCaches } = require("../utils/functions");
const crypto = require('crypto');
const redisClient = require("../utils/redisClient");

async function getTask (req, res, next) {
    const { taskId } = req.params;

    const task = await getDataWithCache(
        `task:${taskId}`, 
        async () => await Task.findById(taskId), 
        600
    );

    if (!task) {
        const error = new Error('Task not found')
        error.status = 404
        return next(error)
    }

    res.locals = {
        ...res.locals,
        resData: task,
        statusCode: 200
    };
    next();
}

async function getTasks(req, res, next) {
    const { workerId, status, page = 1, limit = 10 } = req.query;
    const { id, role } = req.user

    const filter = {};
    if (status) filter.status = status;

    if (role !== 'Admin' && role !== 'Manager') {
        filter.workerId = id;
    } else if (workerId) {
        filter.workerId = workerId;
    }

    const cacheKey = 'tasks:' + crypto.createHash('sha256').update(JSON.stringify(req.query)).digest('hex');

    const tasks = await getDataWithCache(
        cacheKey, 
        async () => await Task.find(filter)
            .skip((page - 1) * limit)
            .limit(Number(limit)),
        60
    );

    res.locals = {
        ...res.locals,
        resData: tasks,
        statusCode: 200
    };
    next();
}

async function createTask (req, res, next) {
    const { name, data } = req.body;
    const task = new Task({ name, metadata: data });
    const createdTask = await task.save();

    await redisClient.set(`task:${createdTask._id}`, JSON.stringify(task), 'EX', 600);
    await invalidateCaches('tasks:*')
    res.locals = {
        ...res.locals,
        resData: task,
        statusCode: 201
    };
    next();
}

async function editTask (req, res, next) {
    const { taskId } = req.params;

    const updatedTask = await Task.findByIdAndUpdate(
        taskId, 
        req.body, 
        { new: true, runValidators: true }
    )

    if (!updatedTask) {
        const error = new Error('Task not found')
        error.status = 404
        return next(error)
    }

    await redisClient.del(`task:${taskId}`);
    await invalidateCaches('tasks:*')

    res.locals = {
        ...res.locals,
        resData: updatedTask,
        statusCode: 200
    };
    next();
}

async function assignWorker (req, res, next) {
    const { taskId, workerId } = req.params;

    const updatedTask = await Task.findByIdAndUpdate(
        taskId, 
        { workerId }, 
        { new: true, runValidators: true }
    )

    if (!updatedTask) {
        const error = new Error('Task not found')
        error.status = 404
        return next(error)
    }

    await redisClient.del(`task:${taskId}`);
    await invalidateCaches('tasks:*')

    res.locals = {
        ...res.locals,
        resData: updatedTask,
        statusCode: 200
    };
    next();
}

async function completeTask (req, res, next) {
    const { taskId } = req.params;

    const updatedTask = await Task.findByIdAndUpdate(
        taskId, 
        { status: 'completed' }, 
        { new: true, runValidators: true }
    )

    if (!updatedTask) {
        const error = new Error('Task not found')
        error.status = 404
        return next(error)
    }

    await redisClient.del(`task:${taskId}`);
    await invalidateCaches('tasks:*')

    res.locals = {
        ...res.locals,
        resData: updatedTask,
        statusCode: 200
    };
    next();
}   

async function deleteTask (req, res, next) {
    const { taskId } = req.params;

    const deletedTask = await Task.findByIdAndDelete(taskId)

    if (!deletedTask) {
        const error = new Error('Task not found')
        error.status = 404
        return next(error)
    }

    await redisClient.del(`task:${taskId}`);
    await invalidateCaches('tasks:*')

    res.locals = {
        ...res.locals,
        resData: `${deletedTask.name} is deleted!`,
        statusCode: 200
    };
    next();
}

module.exports = {
    getTask,
    getTasks,
    createTask,
    editTask,
    assignWorker,
    completeTask,
    deleteTask
}