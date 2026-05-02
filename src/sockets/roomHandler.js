const conversationService = require("../services/conversationService");
module.exports = async (io, socket) => {
  //find all conversations where this user is member
  //loop through the conversations and join each room
  try {
    const userId = socket.user._id.toString();
    const roomIds = await conversationService.getUserConversationIds(userId);
    if (roomIds.length > 0) {
      socket.join(roomIds);
      console.log(`User ${userId} joined ${roomIds.length} rooms`);
    }
  } catch (err) {
    console.error("Error joining conversation rooms:", err);
  }
};
