const { default: mongoose } = require("mongoose");
const User = require("../models/userModel");

exports.searchUsers = async (searchQuery, userId) => {
  const users = await User.find({
    $and: [
      {
        $or: [
          { username: { $regex: searchQuery, $options: "i" } },
          { email: { $regex: searchQuery, $options: "i" } },
        ],
      },
      {
        _id: { $ne: userId },
      },
    ],
  }).select("username avatar status");

  return users;
};

exports.processToggleBlock = async (userId, targetUserId) => {
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

  return {
    message,
    isBlocked: !isAlreadyBlocked,
  };
};
