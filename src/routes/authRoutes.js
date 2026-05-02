const express = require("express");
const { signup, login, logout } = require("../controllers/authController");
const protect = require("../middlewares/authMiddleware");
const router = express.Router();
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", protect, logout);
module.exports = router;
