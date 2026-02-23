const User = require("../models/userModel");
// const Conversation = require("../models/conversationModel");
const Message = require("../models/messageModel");

exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    const senderId = req.user._id;

    //create message
    const newMessage = await Message.create({
      sender: senderId,
      receiver: receiverId,
      message,
    });

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    //check if loggedIn user member in this conversation
    if (!conversation.members.includes(req.user._id)) {
      return res.status(403).json({
        error: "You are not allowed to send messages in this conversation",
      });
    }

    const messages = await Message.find({ conversationId }).sort({
      createdAt: 1,
    });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};
