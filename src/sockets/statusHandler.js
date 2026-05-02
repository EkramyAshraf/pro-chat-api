const User = require("../models/userModel");
const userService = require("../services/userService");
module.exports = async (io, socket) => {
  //1- join user to private room based on their user id
  const userId = socket.user._id.toString();
  socket.join(userId);
  console.log(`User connected: ${socket.user.username} (Room ID: ${userId})`);

  //2.1-update status to online
  await userService.updateUserStatus(userId);

  //2.2-Broadcast to everyone that this user is online
  socket.broadcast.emit("user_status_changed", {
    userId: userId,
    status: "online",
  });

  socket.on("get_user_status", async (data) => {
    try {
      const userId = socket.user._id;
      const { targetUserId } = data;
      const status = await userService.getVisibleStatus(userId, targetUserId);
      socket.emit("user_status", {
        userId: targetUserId,
        status: status,
      });
    } catch (err) {
      console.error("Error in get_user_status:", err.message);
    }
  });

  socket.on("disconnect", async () => {
    console.log("User disconnected");

    //1.1update status to offline
    await User.findByIdAndUpdate(userId, {
      status: "offline",
      lastSeen: new Date(),
    });
    //1.2-Broadcast to everyone that this user is online
    socket.broadcast.emit("user_status_changed", {
      userId: userId,
      status: "offline",
      lastSeen: new Date(),
    });
  });
};
