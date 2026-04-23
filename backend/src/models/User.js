const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // Google's unique ID for this user — never changes
    googleId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    avatar: {
      type: String, // URL to Google profile picture
      default: null,
    },

    // When did this user last sign in?
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;