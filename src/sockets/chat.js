const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Group = require("../models/groupModel");
const Message = require("../models/messageModel");
const Conversation = require("../models/conversationModel");
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

  io.on("connection", async (socket) => {
    //1- join user to private room based on their user id
    const userId = socket.user._id.toString();
    socket.join(userId);
    console.log(
      `✅ User connected: ${socket.user.username} (Room ID: ${userId})`,
    );

    //2.1-update status to online
    await User.findByIdAndUpdate(userId, {
      status: "online",
    });

    //2.2-Broadcast to everyone that this user is online
    socket.broadcast.emit("user_status_changed", {
      userId: userId,
      status: "online",
    });
    //3- handle sending a private message
    socket.on("send_message", async (data) => {
      try {
        const { conversationId, receiverId, content } = data;
        const senderId = socket.user._id;

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
      } catch (error) {
        console.error("❌ socket error:", error);
        socket.emit("error_message", { msg: "Message delivery failed" });
      }
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

    //find all conversations where this user is member
    //loop through the conversations and join each room
    const userConvs = await Conversation.find({ members: userId });
    userConvs.forEach((conv) => {
      const roomId = conv._id.toString();
      socket.join(roomId);
      console.log(`User ${userId} joined room: ${roomId}`);
    });

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
          targetId = conv.members.find(
            (m) => m.toString() !== userId.toString(),
          );
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
          `🗑️ Message ${messageId} deleted in ${conv.type} chat: ${conv._id}`,
        );
      } catch (err) {
        console.error("Error in delete_message socket:", err);
      }
    });

    socket.on("disconnect", async () => {
      console.log("❌ User disconnected");

      //1.1update status to offline
      await User.findByIdAndUpdate(userId, {
        status: "offline",
      });
      //1.2-Broadcast to everyone that this user is online
      socket.broadcast.emit("user_status_changed", {
        userId: userId,
        status: "offline",
      });
    });
  });
};
