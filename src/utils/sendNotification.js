const admin = require("../config/firebaseConfig");

exports.sendPushNotification = async (targetToken, title, message) => {
  const payload = {
    notification: {
      title: title,
      body: message,
    },
  };

  try {
    await admin.messaging().send({ ...payload, token: targetToken });
    console.log("Notification sent successfully!");
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};
