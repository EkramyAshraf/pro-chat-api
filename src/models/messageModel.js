const mongoose = require("mongoose");
const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      require: true,
    },
    receiver: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      require: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
