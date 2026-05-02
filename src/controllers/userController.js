const userService = require("../services/userService");

exports.searchUsers = async (req, res) => {
  try {
    const { searchQuery } = req.query;
    const userId = req.user._id;

    if (!searchQuery) {
      return res
        .status(400)
        .json({ status: "fail", message: "Please provide a search query" });
    }

    const users = await userService.searchUsers(searchQuery, userId);

    res.status(200).json({
      status: "success",
      results: users.length,
      data: users,
    });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

exports.toggleBlock = async (req, res) => {
  try {
    const userId = req.user._id;
    const { targetUserId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ message: "Invalid User ID" });
    }
    const result = await userService.processToggleBlock(userId, targetUserId);

    res.status(200).json({
      status: "success",
      message: result.message,
      isBlocked: result.isBlocked,
    });
  } catch (err) {
    console.error("Block Error:", err);
    const statusCode = err.message === "User not found" ? 400 : 500;
    res.status(statusCode).json({ message: "Server error in toggleBlock" });
  }
};
