const { default: mongoose } = require("mongoose");
const User = require("../models/userModel");

exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res
        .status(400)
        .json({ status: "fail", message: "Please provide a search query" });
    }

    const users = await User.find({
      $and: [
        {
          $or: [
            { username: { $regex: query, $options: "i" } },
            { email: { $regex: query, $options: "i" } },
          ],
        },
        {
          _id: { $ne: req.user._id },
        },
      ],
    }).select("username avatar status");

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
    const user = await User.findById(userId).select("blockedUsers");
    const isAlreadyBlocked = user.blockedUsers.some(
      (id) => id.toString() === targetUserId.toString(),
    );

    let updateAction;
    let message;

    if (isAlreadyBlocked) {
      updateAction = { $pull: { blockedUsers: targetUserId } };
      message = "User unblocked successfully";
    } else {
      updateAction = { $addToSet: { blockedUsers: targetUserId } };
      message = "User blocked successfully";
    }

    await User.findByIdAndUpdate(userId, updateAction);

    res.status(200).json({
      status: "success",
      message,
      isBlocked: !isAlreadyBlocked,
    });
  } catch (err) {
    console.error("Block Error:", err);
    res.status(500).json({ message: "Server error in toggleBlock" });
  }
};
