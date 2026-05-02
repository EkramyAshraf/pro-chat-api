const Conversation = require("../models/conversationModel");

module.exports = async (io, socket) => {
  //find all conversations where this user is member
  //loop through the conversations and join each room
  try {
    const userConvs = await Conversation.find({ members: userId }).select(
      "_id",
    );
    const roomId = userConvs.map((conv) => conv._id.toString());
    socket.join(roomId);
    console.log(`User ${userId} joined room: ${roomId}`);
  } catch (err) {
    console.error("Error joining conversation rooms:", err);
  }
};
