const Group = require("../models/groupModel");
const Conversation = require("../models/conversationModel");
exports.createNewGroup = async (groupData, userId) => {
  const { name, description, members } = groupData;
  const allMembers = [...new Set([...members, userId])];

  //1-create conversation
  const newConversation = await Conversation.create({
    members: allMembers,
  });

  //2-create group
  const newGroup = await Group.create({
    conversationId: newConversation._id,
    name,
    description,
    admin: userId,
    members: allMembers,
  });
  return newGroup;
};

exports.sendGroupMessage = async (senderId, conversationId, content) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new Error("conversation does not exist");
  }
  const newMessage = await Message.create({
    conversationId: conversation._id,
    sender: senderId,
    content: content,
    seenBy: [senderId],
  });
  conversation.lastMessage = newMessage._id;
  conversation.hiddenFor = [];
  await conversation.save();

  return { newMessage, conversation };
};
