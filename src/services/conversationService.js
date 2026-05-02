const Message = require("../models/messageModel");
const Conversation = require("../models/conversationModel");

const User = require("../models/userModel");

//@desc Get all messages within specific conversation
//@route GET /api/conversations/:conversationId/messages
//@access Private

exports.getConversationMessages = async (
  conversationId,
  userId,
  page = 1,
  limit = 20,
) => {
  // 1. Fetch conversation to find the clearance timestamp for this user
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new Error("Conversation not found");
  }

  // 2. Find the user's last clear-chat timestamp, default to 1970 if not found

  const userClearInfo = conversation.clearedAt.find(
    (c) => c.user.toString() === userId.toString(),
  );

  const clearTime = userClearInfo ? new Date(userClearInfo.time) : new Date(0);

  // 3. Define the filter query to only get messages created AFTER the clearTime
  const filterQuery = {
    conversationId,
    createdAt: { $gt: clearTime },
  };
  // 4. Define pagination parameters from query strings
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

  return {
    messages: orderedMessages,
    count: messages.length,
    totalMessages,
    totalPages: Math.ceil(totalMessages / limit),
  };
};

//@desc Get all conversation for the current user (inbox)
//@route GET /api/conversations
//@access Private
exports.getUserInbox = async (userId) => {
  const conversations = await Conversation.find({
    members: { $in: [userId] },
    hiddenFor: { $ne: userId },
  })
    .populate("members", "username avatar status blockedUsers")
    .populate("groupId", "name image description")
    .populate("lastMessage")
    .sort({ updatedAt: -1 });

  return await Promise.all(
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
};

exports.accessUserConversation = async (userId, receiverId) => {
  let existingChat = await Conversation.findOne({
    members: { $all: [userId, receiverId] },
  })
    .populate("members", "username avatar status")
    .populate("lastMessage");

  if (existingChat) {
    return existingChat;
  }

  const newChat = await Conversation.create({
    members: [userId, receiverId],
  });

  const fullChat = await Conversation.findById(newChat._id).populate(
    "members",
    "username avatar status",
  );

  return fullChat;
};

exports.updateMessageSeen = async (conversationId, userId) => {
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
  return result;
};

exports.softDeleteMessage = async (messageId, userId) => {
  const message = await Message.findById(messageId);

  if (!message) throw new Error("Message not found");
  if (message.sender.toString() !== userId.toString())
    throw new Error("Unauthorized");

  message.content = "This message was deleted";
  message.isDeleted = true;
  message.deletedAt = Date.now();
  await message.save();

  await Conversation.updateOne(
    { lastMessage: messageId },
    { $set: { updatedAt: Date.now() } },
  );
  return message;
};

exports.clearChatForUser = async (conversationId, userId) => {
  //1- hide the conversation from the inbox and update clearedAt
  await Conversation.findByIdAndUpdate(conversationId, {
    $addToSet: { hiddenFor: userId },
    $pull: { clearedAt: { user: userId } },
  });

  return await Conversation.findByIdAndUpdate(
    conversationId,
    {
      $push: { clearedAt: { user: userId, time: Date.now() } },
    },
    { new: true },
  );
};

exports.sendPrivateMessage = async (
  senderId,
  conversationId,
  receiverId,
  content,
  fileUrl,
  messageType,
) => {
  const [sender, receiver] = await Promise.all([
    User.findById(senderId).select("blockedUsers"),
    User.findById(receiverId).select("blockedUsers"),
  ]);

  const senderBlocked = receiver.blockedUsers.some(
    (id) => id.toString() === senderId.toString(),
  );

  const receiverBlocked = sender.blockedUsers.some(
    (id) => id.toString() === receiverId.toString(),
  );

  if (senderBlocked) throw new Error("You are blocked by this user");
  if (receiverBlocked)
    throw new Error("Unblock this user first to send messages");
  //find existing conversation between these two users
  let conversation;
  if (conversationId) {
    conversation = await Conversation.findById(conversationId);
  } else if (receiverId) {
    conversation = await Conversation.findOne({
      type: "private",
      members: { $all: [senderId, receiverId] },
    });
  }

  //if no conversation, create one
  if (!conversation) {
    conversation = await Conversation.create({
      members: [senderId, receiverId],
    });
  }

  //3-save the message and link it to the conversation
  const newMessage = await Message.create({
    conversationId: conversation._id,
    sender: senderId,
    content: content,
    fileUrl: fileUrl,
    messageType: messageType || "text",
    seenBy: [senderId],
  });

  //4- update the conversation with the last message ID for the chat list
  conversation.lastMessage = newMessage._id;
  conversation.hiddenFor = [];
  await conversation.save();

  return { newMessage, conversation };
};

exports.getUserConversationIds = async (userId) => {
  const userConvs = await Conversation.find({ members: userId }).select("_id");
  return userConvs.map((conv) => conv._id.toString());
};
