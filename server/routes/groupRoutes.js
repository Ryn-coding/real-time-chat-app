const express = require("express");
const router = express.Router();
const Group = require("../models/Group");
const Message = require("../models/Message");
const authMiddleware = require("../middleware/authMiddleware");

// Create a group
router.post("/", authMiddleware, async (req, res) => {
  const { name, members } = req.body;
  try {
    const group = await Group.create({
      name,
      members: [...members, req.user._id],
      admin: req.user._id,
    });
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: "Failed to create group" });
  }
});

// Get groups user belongs to
router.get("/", authMiddleware, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch groups" });
  }
});

module.exports = router;
