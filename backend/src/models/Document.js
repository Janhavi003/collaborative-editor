const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    // Human-readable string ID we control (not MongoDB's _id)
    // This is what gets passed around in socket events
    documentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    title: {
      type: String,
      default: "Untitled Document",
      maxlength: 500,
    },

    // Full rich-text HTML content
    content: {
      type: String,
      default: "",
    },

    // OT version counter — keeps clients in sync after reconnect
    version: {
      type: Number,
      default: 0,
    },

    // Placeholder for Phase 6 — will reference User._id
    ownerId: {
      type: String,
      default: null,
    },

    // Soft delete — we never truly delete docs
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    // Automatically adds createdAt + updatedAt
    timestamps: true,
  }
);

// Useful index for Phase 7 (listing a user's documents)
documentSchema.index({ ownerId: 1, createdAt: -1 });

const Document = mongoose.model("Document", documentSchema);

module.exports = Document;