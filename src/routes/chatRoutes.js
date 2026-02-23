const express = require("express");
const protect = require("../middlewares/authMiddleware");
const {
  sendMessage,
  getMessages,
} = require("../controllers/messageController");

const router = express.Router();

router.post("/send", protect, sendMessage);
router.get("/:receiverId", protect, getMessages);

module.exports = router;
