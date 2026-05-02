const socketAuth = require("../middlewares/socketAuth");
const chatHandler = require("./chatHandler");
const groupHandler = require("./groupHandler");
const statusHandler = require("./statusHandler");
const roomHandler = require("./roomHandler");
const getRedisAdapter = require("../utils/adapter");
module.exports = async (io) => {
  try {
    // Initialize and wait for the Sharded Redis Adapter
    const adapter = await getRedisAdapter();

    // Bind the adapter to the Socket.io server instanc
    io.adapter(adapter);
    console.log("Socket.io: Standard Redis Adapter successfully applied");

    //auth middleware
    io.use(socketAuth);
    io.on("connection", (socket) => {
      statusHandler(io, socket);
      roomHandler(io, socket);
      chatHandler(io, socket);
      groupHandler(io, socket);
    });
  } catch (error) {
    console.error(
      "Critical Error: Failed to initialize Socket.io Sharded Adapter",
      error,
    );
  }
};
