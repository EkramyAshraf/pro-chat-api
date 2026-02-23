const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Message = require("../models/messageModel");
module.exports = (io) => {
  //auth middleware
  io.use(async (socket, next) => {
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
  });

  io.on("connection", (socket) => {
    console.log(`✅ User connected: ${socket.user.username}`);

    socket.join(socket.user._id.toString());
    try {
      socket.on("send_message", async (data) => {
        const { receiverId, message } = data;
        const newMessage = await Message.create({
          sender: socket.user._id,
          receiver: receiverId,
          message: message,
        });
        io.to(receiverId).emit("receive_message", {
          senderId: socket.user._id,
          message: message,
          timestamp: newMessage.createdAt,
          _id: newMessage._id,
        });
      });
    } catch (error) {
      console.error("Save Error:", error);
    }

    socket.on("disconnect", () => {
      console.log("❌ User disconnected");
    });
  });
};
