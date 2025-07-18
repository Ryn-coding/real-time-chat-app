const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const authMiddleware = require("../middleware/authMiddleware");

// Get messages from a group
router.get("/:groupId", authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({ receiver: req.params.groupId }).sort("timestamp");
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to get messages" });
  }
});

module.exports = router;
