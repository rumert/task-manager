const express = require("express");
const { createEmail } = require("../controllers/emailController");
const { authorizeRoles } = require("../middlewares/authMiddleware");
const { asyncWrapper } = require("../utils/functions");
const { strongRateLimiter } = require("../middlewares/rate-limiter");

const router = express.Router();

router.post("/", strongRateLimiter, authorizeRoles('Admin', 'Manager'), asyncWrapper(createEmail));

module.exports = router;