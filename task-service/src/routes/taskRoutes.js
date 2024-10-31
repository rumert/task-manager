const express = require("express");
const { getTask, getTasks, createTask, editTask, assignWorker, completeTask, deleteTask } = require("../controllers/taskController");
const { authorizeRoles } = require("../middlewares/authMiddleware");
const { asyncWrapper } = require("../utils/functions");
const { normalRateLimiter, strongRateLimiter } = require("../middlewares/rate-limiter");

const router = express.Router();

router.get("/task/:taskId", strongRateLimiter, authorizeRoles('Admin', 'Manager', 'Worker'), asyncWrapper(getTask))
router.post("/task", normalRateLimiter, authorizeRoles('Admin'), asyncWrapper(createTask));
router.put("/task/:taskId", normalRateLimiter, authorizeRoles('Admin'), asyncWrapper(editTask));
router.put("/task/:taskId/assign-worker/:workerId", normalRateLimiter, authorizeRoles('Admin', 'Manager', 'Worker'), asyncWrapper(assignWorker));
router.put("/task/:taskId/complete", normalRateLimiter, authorizeRoles('Admin', 'Manager', 'Worker'), asyncWrapper(completeTask));
router.delete("/task/:taskId", normalRateLimiter, authorizeRoles('Admin'), asyncWrapper(deleteTask));

router.get("/tasks", strongRateLimiter, authorizeRoles('Admin', 'Manager', 'Worker'), asyncWrapper(getTasks))

module.exports = router;