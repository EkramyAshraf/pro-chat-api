const Message = require("../models/messageModel");
const Conversation = require("../models/conversationModel");
module.exports = async (io, socket) => {
  //-- Handling Group Messages ---
  socket.on("send_group_message", async (data) => {
    const { content, conversationId } = data;
    const senderId = socket.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return socket.emit("error_message", {
        msg: "conversation does not exist",
      });
    }
    const newMessage = await Message.create({
      conversationId: conversation._id,
      sender: senderId,
      content: content,
      seenBy: [senderId],
    });
    conversation.lastMessage = newMessage._id;
    conversation.hiddenFor = [];
    await conversation.save();

    await Conversation.findByIdAndUpdate(conversation._id, {
      lastMessage: newMessage._id,
    });

    socket.to(conversationId).emit("receive_group_message", newMessage);
    console.log(
      "✅ Message processed for group conversation:",
      conversation._id,
    );
  });
};
