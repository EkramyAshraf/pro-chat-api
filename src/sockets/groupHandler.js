const groupService = require("../services/groupService");
module.exports = async (io, socket) => {
  //-- Handling Group Messages ---
  socket.on("send_group_message", async (data) => {
    try {
      const { content, conversationId } = data;
      const senderId = socket.user._id;

      const { newMessage, conversation } = await groupService.sendGroupMessage(
        senderId,
        conversationId,
        content,
      );

      socket.to(conversationId).emit("receive_group_message", newMessage);
      console.log(
        "✅ Message processed for group conversation:",
        conversation._id,
      );
    } catch (err) {
      console.error("socket error:", err);
      socket.emit("error_message", {
        msg: err.message || "Message delivery failed",
      });
    }
  });
};
