const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: String,
  receiver: String,
  content: String,
  timestamp: { type: Date, default: Date.now },
  fileUrl: String,
  fileType: String,
  edited: { type: Boolean, default: false },
  reactions: [
    {
      userId: String,
      emoji: String,
    },
  ],
  delivered: { type: Boolean, default: false },
  seenBy: [String],
});

module.exports = mongoose.model("Message", messageSchema);
