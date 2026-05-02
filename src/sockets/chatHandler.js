const conversationService = require("../services/conversationService");
const { sendChatNotification } = require("../services/notificationService");
module.exports = async (io, socket) => {
  const userId = socket.user._id.toString();

  //handle sending a private message
  socket.on("send_message", async (data) => {
    try {
      const { conversationId, receiverId, content, fileUrl, messageType } =
        data;
      const senderId = socket.user._id;

      const { conversation, newMessage } =
        await conversationService.sendPrivateMessage(
          senderId,
          conversationId,
          receiverId,
          content,
          fileUrl,
          messageType,
        );
      //5- emit the message to the receiver private room
      const targetMember = conversation.members.find(
        (m) => m.toString() !== senderId.toString(),
      );
      if (targetMember) {
        io.to(targetMember.toString()).emit("receive_message", newMessage);
      }

      //6- send a confirmation back to the sender
      socket.emit("message_sent", newMessage);

      //send notification to receiver if he is offline
      sendChatNotification(receiverId, userId, content);
    } catch (error) {
      console.error("socket error:", error);
      socket.emit("error_message", { message: err.message });
    }
  });

  //typing indicator
  socket.on("typing", async (data) => {
    const { receiverId, conversationId } = data;
    socket.to(receiverId).emit("display_typing", {
      senderId: userId,
      conversationId: conversationId,
    });
  });

  socket.on("stop_typing", async (data) => {
    const { receiverId, conversationId } = data;
    socket.to(receiverId).emit("hide_typing", {
      conversationId: conversationId,
    });
  });

  //mark message as seen
  socket.on("mark_as_seen", async ({ conversationId, senderId }) => {
    try {
      const userId = socket.user._id;
      //1- validation:Ensure required data is present
      if (!conversationId || !senderId) {
        throw new Error(
          "Missing data: conversationId and senderId are required",
        );
      }
      //2-Database Update: update all unread message from this sender in the conversation
      const result = await conversationService.updateMessageSeen(
        conversationId,
        senderId,
      );

      //3-Notify the sender: only if messages were actually updated
      if (result.modifiedCount > 0) {
        //send event to the original sender room
        io.to(senderId).emit("messages_seen", {
          conversationId,
          userId,
          status: "read",
        });
        console.log(
          `Success: ${result.modifiedCount} messages marked as seen in conv: ${conversationId}`,
        );
      }
    } catch (err) {
      console.error(`[MarkAsSeen Error]: ${err.message}`);
      socket.emit("error_message", {
        action: "mark_as_seen",
        message: err.message,
      });
    }
  });

  //handle deleting message
  socket.on("delete_message", async (data) => {
    try {
      const { messageId } = data;
      const message = await conversationService.softDeleteMessage(
        messageId,
        userId,
      );
      const conv = message.conversationId;

      let targetId;
      if (conv.type === "private") {
        targetId = conv.members.find((m) => m.toString() !== userId.toString());
        if (targetId) {
          io.to(targetId.toString()).emit("message_deleted", {
            messageId,
            conversationId: conv._id,
          });
        }
      } else {
        socket.to(conv._id.toString()).emit("message_deleted", {
          messageId,
          conversationId: conv._id,
        });
      }
      socket.emit("message_deleted", { messageId, conversationId: conv._id });

      console.log(
        `Message ${messageId} deleted in ${conv.type} chat: ${conv._id}`,
      );
    } catch (err) {
      console.error("Delete Error:", err.message);
      socket.emit("error_message", { msg: err.message });
    }
  });
};
