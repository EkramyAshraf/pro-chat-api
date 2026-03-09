const express = require("express");
const protect = require("../middlewares/authMiddleware");
const {
  getConversations,
  getMessages,
  accessConversation,
  markAsSeen,
  deleteMessage,
  clearConversation,
} = require("../controllers/conversationController");

const router = express.Router();

router.get("/", protect, getConversations);
router.get("/:conversationId/messages", protect, getMessages);
router.post("/access", protect, accessConversation);
router.delete("/messages/:messageId", protect, deleteMessage);
router.patch("/mark-as-seen/:conversationId", protect, markAsSeen);

router.delete("/:conversationId/clear", protect, clearConversation);

module.exports = router;
