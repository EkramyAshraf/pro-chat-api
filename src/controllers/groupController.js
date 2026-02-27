const Group = require("../models/groupModel");
exports.createGroup = async (req, res) => {
  try {
    const { name, description, members } = req.body;
    const allMembers = [...new Set([...members, req.user._id])];
    const newGroup = await Group.create({
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
