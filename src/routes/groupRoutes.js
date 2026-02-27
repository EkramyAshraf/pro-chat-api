const express = require("express");
const protect = require("../middlewares/authMiddleware");
const { createGroup } = require("../controllers/groupController");

const router = express.Router();

router.post("/create", protect, createGroup);

module.exports = router;
