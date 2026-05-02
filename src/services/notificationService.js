const { sendPushNotification } = require("../utils/sendNotification");
const User = require("../models/userModel");

exports.sendChatNotification = async (receiverId, senderId, content) => {
  const receiver = await User.findById(receiverId).select("status fcmToken");
  if (receiver && receiver.status !== "online" && receiver.fcmToken) {
    sendPushNotification(
      receiver.fcmToken,
      `message from ${senderId}`,
      content,
    );
  }
};
