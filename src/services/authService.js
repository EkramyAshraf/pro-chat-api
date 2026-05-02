const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { promisify } = require("util");

const createToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

exports.registerUser = async (userData) => {
  const newUser = await User.create(userData);
  const token = createToken(newUser._id);
  return { newUser, token };
};

exports.loginUser = async (email, password, fcmToken) => {
  const user = await User.findOne({ email: email }).select("+password");
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(404).json({ error: "incorrect password" });
  }

  user.fcmToken = fcmToken;
  user.status = "online";
  await user.save({ validateBeforeSave: false });
  const token = createToken(user._id);
  return { user, token };
};

exports.clearUserSession = async (userId) => {
  return await User.findByIdAndUpdate(userId, {
    fcmToken: null,
    status: "offline",
  });
};
