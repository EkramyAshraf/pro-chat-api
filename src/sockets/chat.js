const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
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
        const { receiverId, content } = data;
        const senderId = socket.user._id;

        //find existing conversation between these two users
        let conversation = await Conversation.findOne({
          members: { $all: [senderId, receiverId] },
        });

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
          receiver: receiverId,
          content: content,
        });

        //4- update the conversation with the last message ID for the chat list
        conversation.lastMessage = newMessage._id;
        await conversation.save();

        //5- emit the message to the receiver private room
        io.to(receiverId).emit("receive_message", newMessage);

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
          { conversationId, sender: senderId, seen: false },
          { $set: { seen: true } },
        );

        //3-Notify the sender: only if messages were actually updated
        if (result.modifiedCount > 0) {
          //send event to the original sender room
          io.to(senderId).emit("messages_seen", {
            conversationId,
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
