// models/User.js
const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: true,
      select: false,
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: "passwords are not the same",
      },
    },
    avatar: {
      type: String,
      default: "",
    },
    fcmToken: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["online", "offline"],
      default: "offline",
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true },
);

const bcrypt = require("bcryptjs");

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
});

const User = mongoose.model("User", userSchema);

module.exports = User;
