const conversationService = require("../services/conversationService");
//@desc Get all messages within specific conversation
//@route GET /api/conversations/:conversationId/messages
//@access Private

exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);

    const result = await conversationService.getConversationMessages(
      conversationId,
      userId,
      page,
      limit,
    );

    res.status(200).json({
      status: "success",
      results: result.count,
      pagination: {
        totalMessages: result.totalMessages,
        currentPage: page,
        totalPages: result.totalPages,
        hasNextPage: page < Math.ceil(result.totalMessages / limit),
      },
      data: result.messages,
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

    const conversations = await conversationService.getUserInbox(userId);

    res.status(200).json(conversations);
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

exports.accessConversation = async (req, res) => {
  try {
    const userId = req.user._id;

    const { receiverId } = req.body;
    const conversation = await conversationService.accessUserConversation(
      userId,
      receiverId,
    );

    res.status(200).json(conversation);
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

exports.markAsSeen = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;

    const result = await conversationService.updateMessageSeen(
      conversationId,
      userId,
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

    const message = await conversationService.softDeleteMessage(
      messageId,
      userId,
    );
    res.status(200).json({ status: "success", data: message });
  } catch (err) {
    const statusCode = err.message === "Unauthorized" ? 403 : 404;
    res.status(statusCode).json({ status: "fail", message: err.message });
  }
};

exports.clearConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;
    await conversationService.clearChatForUser(conversationId, userId);
    res.status(200).json({
      status: "success",
      message: "conversation is deleted",
    });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};
