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
