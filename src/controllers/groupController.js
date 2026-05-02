const groupService = require("../services/groupService");
exports.createGroup = async (req, res) => {
  try {
    const adminId = req.user._id;
    const newGroup = await groupService.createNewGroup(req.body, adminId);

    res.status(201).json({
      success: true,
      data: newGroup,
    });
  } catch (error) {
    console.error("Error in createGroup Controller:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error while creating group",
    });
  }
};
