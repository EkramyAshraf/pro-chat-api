const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const path = require("path");
const dotenv = require("dotenv");
const cors = require("cors");
const { Server } = require("socket.io");

dotenv.config();
const authRoutes = require("./routes/authRoutes");
// const messageRoutes = require("./routes/messagesRoutes");
// const conversationRoutes = require("./routes/conversationRoutes");
const app = express();

// Body parser, reading data from body into req.body
app.use(cors());
app.use(express.json({ limit: "20kb" }));
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
app.get("/", (req, res) => {
  res.send("server is running");
});

//connect MongoDB
mongoose
  .connect(process.env.MONGO_URI, {})
  .then(() => {
    console.log("DB connection successful!");
  })
  .catch((err) => {
    console.log(err);
  });

//mount routes
app.use("/api/auth", authRoutes);
// app.use("/api/messages", messageRoutes);
// app.use("/api/conversations", conversationRoutes);

//Socket.io basic connection
require("./sockets/chat")(io);
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
