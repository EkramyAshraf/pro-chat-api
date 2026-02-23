const User = require("../models/userModel");
const Message = require("../models/messageModel");
const Conversation = require("../models/conversationModel");

//@desc Get all conversation for the current user (inbox)
//@route GET /api/conversations
//@access Private
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    //1-fetch conversations where the user is a member
    const conversations = await Conversation.find({
      members: { $in: [userId] },
    })
      .populate({ path: "members", select: "username avatar" })
      .populate({ path: "lastMessage", select: "sender content createdAt" })
      .sort({ updatedAt: -1 });

    //2- format the response to highlight the 'other member'

    const formattedConversations = conversations.map((conv) => {
      const otherMember = conv.members.find(
        (member) => member._id.toString() !== userId.toString(),
      );
      return {
        _id: conv._id,
        otherMember: otherMember,
        lastMessage: conv.lastMessage,
        updatedAt: conv.updatedAt,
      };
    });

    res.status(200).json(formattedConversations);
  } catch (error) {
    console.error("Error in getConversations:", error);
    res.status(500).json({ message: "Server error fetching conversations" });
  }
};

//@desc Get all messages within specific conversation
//@route GET /api/conversations/:conversationId/messages
//@access Private

exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    //fetch messages linked to conversation ID
    const messages = await Message.find({ conversationId }).sort({
      createdAt: 1,
    });
    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getMessages:", error);
    res.status(500).json({ message: "Server error fetching Messages" });
  }
};
