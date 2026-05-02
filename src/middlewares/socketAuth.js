const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
module.exports = async (socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) {
    return next(new Error("Authentication error: Token missing"));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    socket.user = user;

    next();
  } catch (err) {
    next(new Error("Authentication error: Invalid token"));
  }
};
