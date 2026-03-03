const express = require("express");
const protect = require("../middlewares/authMiddleware");
const {
  getConversations,
  getMessages,
  accessConversation,
  markAsSeen,
} = require("../controllers/conversationController");

const router = express.Router();

router.get("/", protect, getConversations);
router.get("/:conversationId/messages", protect, getMessages);
router.post("/access", protect, accessConversation);
router.patch("/mark-as-seen/:conversationId", protect, markAsSeen);

module.exports = router;
