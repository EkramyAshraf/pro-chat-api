const { Redis } = require("ioredis");
const { createAdapter } = require("@socket.io/redis-adapter");

const getRedisAdapter = async () => {
  //ioredis connects automatically
  const pubClient = new Redis({ host: "127.0.0.1", port: 6379 });
  const subClient = pubClient.duplicate();

  // Adding event listeners to monitor connection status in PM2 logs
  pubClient.on("connect", () =>
    console.log(`Redis PubClient connected | PID: ${process.pid}`),
  );
  subClient.on("connect", () =>
    console.log(`Redis SubClient connected | PID: ${process.pid}`),
  );
  return createAdapter(pubClient, subClient);
};

module.exports = getRedisAdapter;
