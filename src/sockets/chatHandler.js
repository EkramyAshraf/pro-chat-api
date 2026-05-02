const Message = require("../models/messageModel");
const User = require("../models/userModel");
const Conversation = require("../models/conversationModel");
const { sendChatNotification } = require("../services/notificationService");
module.exports = async (io, socket) => {
  const userId = socket.user._id.toString();

  //handle sending a private message
  socket.on("send_message", async (data) => {
    try {
      const { conversationId, receiverId, content, fileUrl, messageType } =
        data;
      const senderId = socket.user._id;

      const [sender, receiver] = await Promise.all([
        User.findById(senderId).select("blockedUsers"),
        User.findById(receiverId).select("blockedUsers"),
      ]);

      const senderBlocked = receiver.blockedUsers.some(
        (id) => id.toString() === senderId.toString(),
      );

      const receiverBlocked = sender.blockedUsers.some(
        (id) => id.toString() === receiverId.toString(),
      );

      if (senderBlocked) {
        return socket.emit("error_message", {
          message: "You are blocked by this user",
        });
      }

      if (receiverBlocked) {
        return socket.emit("error_message", {
          message: "Unblock this user first to send messages",
        });
      }
      //find existing conversation between these two users
      let conversation;
      if (conversationId) {
        conversation = await Conversation.findById(conversationId);
      } else if (receiverId) {
        conversation = await Conversation.findOne({
          type: "private",
          members: { $all: [senderId, receiverId] },
        });
      }

      //if no conversation, create one
      if (!conversation) {
        conversation = await Conversation.create({
          members: [senderId, receiverId],
        });
      }

      //3-save the message and link it to the conversation
      const newMessage = await Message.create({
        conversationId: conversation._id,
        sender: senderId,
        content: content,
        fileUrl: fileUrl,
        messageType: messageType || "text",
        seenBy: [senderId],
      });

      //4- update the conversation with the last message ID for the chat list
      conversation.lastMessage = newMessage._id;
      conversation.hiddenFor = [];
      await conversation.save();

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
      socket.emit("error_message", { msg: "Message delivery failed" });
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
      //1- validation:Ensure required data is present
      if (!conversationId || !senderId) {
        return console.log(
          "Missing data: conversationId and senderId are required",
        );
      }
      //2-Database Update: update all unread message from this sender in the conversation
      const result = await Message.updateMany(
        {
          conversationId,
          sender: { $ne: userId },
          seenBy: { $nin: [userId] },
        },
        {
          $addToSet: { seenBy: userId },
        },
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
      console.error("Error in mark_as seen event");
    }
  });

  //handle deleting message
  socket.on("delete_message", async (data) => {
    try {
      const { messageId } = data;
      const message =
        await Message.findById(messageId).populate("conversationId");
      if (!message)
        return socket.emit("error_message", { msg: "Message not found" });

      if (message.sender.toString() !== userId.toString()) {
        return socket.emit("error_message", { msg: "Unauthorized" });
      }

      message.content = "This message was deleted";
      message.isDeleted = true;
      message.deletedAt = new Date();
      await message.save();

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
      console.error("Error in delete_message socket:", err);
    }
  });
};
