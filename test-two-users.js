const { io } = require("socket.io-client");

// 🔴 حط التوكنات الحقيقية هنا
const tokenUser1 =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5OWIxMTNkM2YzYmQxNDY5ODRmZDI4ZiIsImlhdCI6MTc3MTg4MzM4MCwiZXhwIjoxNzcxOTY5NzgwfQ.PjFK93npu8XWEPp2QTRtCoUxOmi5RHIqCe94xV3Pr_k";
const tokenUser2 =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5OWM1M2RlOGIzMDZkNGU0YWVkYTI2YSIsImlhdCI6MTc3MTg4MzQwNiwiZXhwIjoxNzcxOTY5ODA2fQ.hlbRQA8OvpvFUQHODwkYiEJRaWyZgL1C_5mJiQNSSvA";

// 🔴 حط IDs المستخدمين هنا
const user1Id = "699b113d3f3bd146984fd28f";
const user2Id = "699c53de8b306d4e4aeda26a";

// اتصال المستخدم الأول
const user1 = io("http://localhost:3000", {
  auth: { token: tokenUser1 },
});

// اتصال المستخدم الثاني
const user2 = io("http://localhost:3000", {
  auth: { token: tokenUser2 },
});

// لما الأول يتصل
user1.on("connect", () => {
  console.log("🟢 User1 connected");

  // بعد ثانية يبعت رسالة
  setTimeout(() => {
    user1.emit("send_message", {
      receiverId: user2Id,
      content: "Hello from User1 🚀",
    });
  }, 1000);
});

// لما الثاني يتصل
user2.on("connect", () => {
  console.log("🔵 User2 connected");
});

// يستقبل رسالة
user2.on("receive_message", (msg) => {
  console.log("📩 User2 received:", msg.content);

  // يرد بعدها بثانية
  setTimeout(() => {
    user2.emit("send_message", {
      receiverId: user1Id,
      content: "Reply from User2 🔥",
    });
  }, 1000);
});

// الأول يستقبل الرد
user1.on("receive_message", (msg) => {
  console.log("📩 User1 received:", msg.content);
});
