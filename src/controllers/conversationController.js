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

    const results = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          sender: { $ne: req.user._id },
          $or: [
            { type: "private", seen: false },
            { type: "group", seenBy: { $nin: [req.user._id] } },
          ],
        });

        const convObj = conv.toObject();
        convObj.unreadCount = unreadCount;
        return convObj;
      }),
    );
    res.status(200).json(results);
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

exports.accessConversation = async (req, res) => {
  try {
    const { receiver } = req.body;

    let existingChat = await Conversation.findOne({
      members: { $all: [req.user._id, receiver] },
    })
      .populate("members", "username avatar status")
      .populate("lastMessage");

    if (existingChat) {
      return res.status(200).json(existingChat);
    }

    const newChat = await Conversation.create({
      members: [req.user._id, receiver],
    });

    const fullChat = await Conversation.findById(newChat._id).populate(
      "members",
      "username avatar status",
    );

    res.status(200).json(fullChat);
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

exports.markAsSeen = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const result = await Message.updateMany(
      {
        conversationId,
        sender: { $ne: req.user._id },
        $or: [
          { type: "private", seen: false, receiver: req.user._id },
          { type: "group", seenBy: { $nin: [req.user._id] } },
        ],
      },
      {
        $set: { seen: true },
        $addToSet: { seenBy: req.user._id },
      },
    );
    res.status(200).json({
      status: "success",
      message: "message seen",
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};
