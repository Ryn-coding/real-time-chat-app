const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const Message = require("../models/Message");

router.get("/:userId", auth, async (req, res) => {
  const currentUserId = req.user.id;
  const otherUserId = req.params.userId;

  try {
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId },
      ],
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch messages" });
  }
});

// Update message
router.put("/:id", auth, async (req, res) => {
  const { content } = req.body;

  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (message.sender !== req.user.id)
      return res.status(403).json({ message: "Not authorized" });

    message.content = content;
    message.edited = true;
    await message.save();

    // ✅ Emit socket event
    const io = req.app.get("io"); // make sure you attached io in your server.js
    if (io) {
      io.to(message.sender).emit("message-edited", message);
      io.to(message.receiver).emit("message-edited", message);
    }

    res.json(message);
  } catch (err) {
    console.error("Edit Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete message
router.delete("/:id", auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (message.sender !== req.user.id)
      return res.status(403).json({ message: "Not authorized" });

    await Message.deleteOne({ _id: req.params.id });

    // ✅ Emit socket event
    const io = req.app.get("io");
    if (io) {
      io.to(message.sender).emit("message-deleted", {
        messageId: req.params.id,
      });
      io.to(message.receiver).emit("message-deleted", {
        messageId: req.params.id,
      });
    }

    res.json({ message: "Message deleted" });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// routes/messages.js
router.post("/:id/react", async (req, res) => {
  const { emoji, userId } = req.body;
  const messageId = req.params.id;

  try {
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ error: "Message not found" });

    // Find existing reaction by the user
    const existingReaction = message.reactions.find(
      (r) => r.userId.toString() === userId
    );

    if (existingReaction) {
      if (existingReaction.emoji === emoji) {
        // Toggle off if same emoji
        message.reactions = message.reactions.filter(
          (r) => r.userId.toString() !== userId
        );
      } else {
        // Replace with new emoji
        message.reactions = message.reactions.filter(
          (r) => r.userId.toString() !== userId
        );
        message.reactions.push({ emoji, userId });
      }
    } else {
      // No existing reaction, just add
      message.reactions.push({ emoji, userId });
    }

    await message.save();

    res.status(200).json({ success: true, reactions: message.reactions });
  } catch (error) {
    console.error("Reaction error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;
