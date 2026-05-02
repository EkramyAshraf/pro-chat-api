const socketAuth = require("../middlewares/socketAuth");
const chatHandler = require("./chatHandler");
const groupHandler = require("./groupHandler");
const statusHandler = require("./statusHandler");
const roomHandler = require("./roomHandler");

module.exports = (io) => {
  //auth middleware
  io.use(socketAuth);
  io.on("connection", (socket) => {
    statusHandler(io, socket);
    roomHandler(io, socket);
    chatHandler(io, socket);
    groupHandler(io, socket);
  });
};
