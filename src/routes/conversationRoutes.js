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
const upload = require("../middlewares/uploadMiddleware");
const router = express.Router();

router.get("/", protect, getConversations);
router.get("/:conversationId/messages", protect, getMessages);
router.post("/access", protect, accessConversation);
router.delete("/messages/:messageId", protect, deleteMessage);
router.patch("/mark-as-seen/:conversationId", protect, markAsSeen);
router.delete("/:conversationId/clear", protect, clearConversation);
router.post("/upload-image", protect, upload.single("image"), (req, res) => {
  try {
    if (!req.file) return res.status(400).send("No file uploaded.");
    res.status(200).json({
      status: "success",
      data: {
        image: req.file.path,
        messageType: "image",
      },
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});
module.exports = router;
