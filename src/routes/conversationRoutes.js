const express = require("express");
const protect = require("../middlewares/authMiddleware");
const {
  getConversations,
  getMessages,
} = require("../controllers/conversationController");

const router = express.Router();

router.get("/", protect, getConversations);
router.get("/:conversationId/messages", protect, getMessages);

module.exports = router;
