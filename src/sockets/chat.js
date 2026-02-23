const jwt = require("jsonwebtoken");
module.exports = (io) => {
  //auth middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error("Authentication error: Token missing"));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;

      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(
      `✅ User Authorized: ${socket.userId} (Socket ID: ${socket.id})`,
    );

    socket.on("disconnect", () => {
      console.log("❌ User disconnected");
    });
  });
};
