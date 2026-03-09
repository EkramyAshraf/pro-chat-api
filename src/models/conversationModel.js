const mongoose = require("mongoose");
const conversationSchema = new mongoose.Schema(
  {
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User",
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    type: {
      type: String,
      enum: ["private", "group"],
      default: "private",
      required: true,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },
    hiddenFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    clearedAt: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        time: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

const Conversation = mongoose.model("Conversation", conversationSchema);

module.exports = Conversation;
