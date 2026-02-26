const { io } = require("socket.io-client");

// 🟢 إعدادات البيانات (استخدم التوكنات والـ IDs اللي عندك)
const SERVER_URL = "http://localhost:3000";
const tokenUser1 =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5OWIxMTNkM2YzYmQxNDY5ODRmZDI4ZiIsImlhdCI6MTc3MjE0NTAxNiwiZXhwIjoxNzcyMjMxNDE2fQ._dPftFGDn5ukBapPqfcYw0n7g2_R7qO3LifGelnn9aE";
const tokenUser2 =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5OWM1M2RlOGIzMDZkNGU0YWVkYTI2YSIsImlhdCI6MTc3MjE0NDk4NiwiZXhwIjoxNzcyMjMxMzg2fQ.o9BPuREDjdHo6f1279NmAIxMvadn8HWVwCqvH2f17tM";
const user2Id = "699c53de8b306d4e4aeda26a";
const user1Id = "699b113d3f3bd146984fd28f";

// 1. فتح الاتصال للطرفين
const socket1 = io(SERVER_URL, { auth: { token: tokenUser1 } });
const socket2 = io(SERVER_URL, { auth: { token: tokenUser2 } });

// ---------------------------------------------------------
// اختبار User 1 (الراسل)
// ---------------------------------------------------------
socket1.on("connect", () => {
  console.log("🟢 User 1: Connected and ready to send.");

  // بعد ثانية، User 1 يبعت رسالة لـ User 2
  setTimeout(() => {
    console.log("📤 User 1: Sending message...");
    socket1.emit("send_message", {
      receiverId: user2Id,
      content: "Hey User 2, did you see this? 🔥",
    });
  }, 2000);
});

// User 1 بيراقب لو رسالته اتشافت
socket1.on("messages_seen", (data) => {
  console.log("✅ User 1 NOTIFIED: User 2 has SEEN the messages!", data);
  console.log("🚀 FULL CHAT CYCLE COMPLETED SUCCESSFULLY!");
  process.exit(0); // إنهاء التيست بنجاح
});

// ---------------------------------------------------------
// اختبار User 2 (المستلم)
// ---------------------------------------------------------
socket2.on("connect", () => {
  console.log("🔵 User 2: Connected and waiting for messages.");
});

// User 2 بيستقبل الرسالة
socket2.on("receive_message", (newMessage) => {
  console.log("📩 User 2: Received new message:", newMessage.content);
  console.log("🆔 Conversation ID:", newMessage.conversationId);

  // بعد ما يستلم، يبعت إنه شافها (Seen)
  setTimeout(() => {
    console.log("👁️  User 2: Marking as seen...");
    socket2.emit("mark_as_seen", {
      conversationId: newMessage.conversationId,
      senderId: user1Id, // بنحدث رسايل User 1
    });
  }, 2000);
});

// ---------------------------------------------------------
// معالجة الأخطاء
// ---------------------------------------------------------
socket1.on("connect_error", (err) =>
  console.log("❌ User 1 Auth Error:", err.message),
);
socket2.on("connect_error", (err) =>
  console.log("❌ User 2 Auth Error:", err.message),
);

// Timer عشان لو التيست علق
setTimeout(() => {
  console.log(
    "⏱️ Test timed out. Check if server is running or IDs are correct.",
  );
  process.exit(1);
}, 10000);
