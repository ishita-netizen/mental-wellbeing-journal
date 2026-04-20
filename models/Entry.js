const mongoose = require("mongoose");

const EntrySchema = new mongoose.Schema({
  userId: {
    type: String,
    default: "demo-user"
  },

  text: {
    type: String,
    required: true
  },

  mood: {
    type: String,
    required: true
  },

  sentimentScore: {
    type: Number,
    required: true
  },

  severity: {
    type: String,
    enum: ["Low", "Moderate", "High"],
    required: true
  },

  mismatch: {
    type: Boolean,
    default: false
  },

  perceptionType: {
    type: String,
    enum: ["Aligned", "Masking Stress", "Resilience"],
    default: "Aligned"
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Entry", EntrySchema);
