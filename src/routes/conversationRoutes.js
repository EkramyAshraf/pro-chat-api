const express = require("express");
const protect = require("../middlewares/authMiddleware");
const {
  getConversations,
  getMessages,
  accessConversation,
} = require("../controllers/conversationController");

const router = express.Router();

router.get("/", protect, getConversations);
router.get("/:conversationId/messages", protect, getMessages);
router.post("/access", protect, accessConversation);

module.exports = router;
