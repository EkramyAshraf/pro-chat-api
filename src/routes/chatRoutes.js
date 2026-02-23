const express = require("express");
const protect = require("../middlewares/authMiddleware");
const { sendMessage } = require("../controllers/messageController");

const router = express.Router();

router.post("/send", protect, sendMessage);
// router.get("/:conversationId", protect, getMessages);

module.exports = router;
