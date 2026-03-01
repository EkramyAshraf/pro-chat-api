const express = require("express");
const protect = require("../middlewares/authMiddleware");
const { searchUsers } = require("../controllers/userController");

const router = express.Router();

router.get("/search", protect, searchUsers);

module.exports = router;
