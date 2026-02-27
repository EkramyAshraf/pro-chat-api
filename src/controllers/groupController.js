const Group = require("../models/groupModel");
const Conversation = require("../models/conversationModel");
exports.createGroup = async (req, res) => {
  try {
    const { name, description, members } = req.body;
    const allMembers = [...new Set([...members, req.user._id])];

    //1-create conversation
    const newConversation = await Conversation.create({
      members: allMembers,
    });

    //2-create group
    const newGroup = await Group.create({
      conversationId: newConversation._id,
      name,
      description,
      admin: req.user._id,
      members: allMembers,
    });
    res.status(201).json({
      success: true,
      data: newGroup,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
