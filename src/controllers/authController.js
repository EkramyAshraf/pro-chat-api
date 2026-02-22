const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { promisify } = require("util");

exports.signup = async (req, res) => {
  try {
    const { username, email, password, passwordConfirm } = req.body;
    const newUser = await User.create({
      username,
      email,
      password,
      passwordConfirm,
    });

    res.status(201).json({
      status: "success",
      newUser,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email }).select("+password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(404).json({ error: "incorrect password" });
    }

    const token = await jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.status(200).json({
      status: "success",
      username: user.username,
      token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
