const User = require("../models/userModel");
const Message = require("../models/messageModel");
const Conversation = require("../models/conversationModel");

//@desc Get all messages within specific conversation
//@route GET /api/conversations/:conversationId/messages
//@access Private

exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;
    // 1. Fetch conversation to find the clearance timestamp for this user
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // 2. Find the user's last clear-chat timestamp, default to 1970 if not found

    const userClearInfo = conversation.clearedAt.find(
      (c) => c.user.toString() === userId.toString(),
    );

    const clearTime = userClearInfo
      ? new Date(userClearInfo.time)
      : new Date(0);

    // 3. Define the filter query to only get messages created AFTER the clearTime
    const filterQuery = {
      conversationId,
      createdAt: { $gt: clearTime },
    };
    // 4. Define pagination parameters from query strings
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // 2. Fetch messages: Sort by newest first to apply skip/limit correctly
    const messages = await Message.find(filterQuery)
      .populate("sender", "username avatar")
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit);

    // 3. Reverse the array so the frontend displays them in chronological order
    const orderedMessages = messages.reverse();

    // 4. Calculate total messages for frontend scroll logic
    const totalMessages = await Message.countDocuments(filterQuery);

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
    const userId = req.user._id;

    const conversations = await Conversation.find({
      members: { $in: [userId] },
      hiddenFor: { $ne: userId },
    })
      .populate("members", "username avatar status blockedUsers")
      .populate("groupId", "name image description")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    const results = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          sender: { $ne: userId },
          seenBy: { $nin: [userId] },
          isDeleted: false,
        });

        const convObj = conv.toObject();
        convObj.unreadCount = unreadCount;

        if (conv.type === "private") {
          const me = conv.members.find(
            (m) => m._id.toString() === userId.toString(),
          );

          const otherUser = conv.members.find(
            (m) => m._id.toString() !== userId.toString(),
          );

          if (me && otherUser) {
            const iBlockedHim = me.blockedUsers.some(
              (b) => b.toString() === otherUser._id.toString(),
            );

            const heBlockedMe = otherUser.blockedUsers.some(
              (b) => b.toString() === me._id.toString(),
            );
            convObj.isBlocked = iBlockedHim || heBlockedMe;
            convObj.blockedByMe = iBlockedHim;
          } else {
            convObj.isBlocked = false;
            convObj.blockedByMe = false;
          }
        }
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
    const userId = req.user._id;

    const { receiver } = req.body;

    let existingChat = await Conversation.findOne({
      members: { $all: [userId, receiver] },
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
    const userId = req.user._id;

    const { conversationId } = req.params;
    const result = await Message.updateMany(
      {
        conversationId,
        sender: { $ne: userId },
        seenBy: { $nin: [userId] },
      },
      {
        $addToSet: { seenBy: userId },
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

exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "message not found" });
    }

    if (message.sender.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "you can not perform this action" });
    }

    message.content = "This message was deleted";
    message.isDeleted = true;
    message.deletedAt = Date.now();
    await message.save();

    res.status(200).json({ status: "success", data: message });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

exports.clearConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    //1- hide the conversation from the inbox and update clearedAt
    await Conversation.findByIdAndUpdate(conversationId, {
      $addToSet: { hiddenFor: userId },
      $pull: { clearedAt: { user: userId } },
    });

    await Conversation.findByIdAndUpdate(conversationId, {
      $push: { clearedAt: { user: userId, time: Date.now() } },
    });
    res.status(200).json({
      status: "success",
      message: "conversation is deleted",
    });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};
