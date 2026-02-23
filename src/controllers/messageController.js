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
    const { receiverId } = req.params;
    const senderId = req.user._id;

    const messages = await Message.find({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
