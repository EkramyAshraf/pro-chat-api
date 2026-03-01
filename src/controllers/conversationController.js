const User = require("../models/userModel");
const Message = require("../models/messageModel");
const Conversation = require("../models/conversationModel");

//@desc Get all messages within specific conversation
//@route GET /api/conversations/:conversationId/messages
//@access Private

exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    // 1. Define pagination parameters from query strings
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // 2. Fetch messages: Sort by newest first to apply skip/limit correctly
    const messages = await Message.find({ conversationId })
      .populate("sender", "username avatar")
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit);

    // 3. Reverse the array so the frontend displays them in chronological order
    const orderedMessages = messages.reverse();

    // 4. Calculate total messages for frontend scroll logic
    const totalMessages = await Message.countDocuments({ conversationId });

    res.status(200).json({
      status: "success",
      results: messages.length,
      pagination: {
        totalMessages,
        currentPage: page,
        totalPages: Math.ceil(totalMessages / limit),
        hasNextPage: page < Math.ceil(totalMessages / limit),
      },
      data: orderedMessages,
    });
  } catch (error) {
    console.error("Error in getMessages:", error);
    res.status(500).json({ message: "Server error fetching Messages" });
  }
};

//@desc Get all conversation for the current user (inbox)
//@route GET /api/conversations
//@access Private
exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      members: { $in: [req.user._id] },
    })
      .populate("members", "username avatar status")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    res.status(200).json({
      status: "success",
      results: conversations.length,
      data: conversations,
    });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};
