const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
module.exports = async (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
    const freshUser = await User.findById(decoded.id);
    if (!freshUser) {
      return res.status(401).json({ error: "this user is no longer exists" });
    }
    req.user = freshUser;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};
