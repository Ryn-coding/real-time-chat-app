const express = require("express");
const router = express.Router();
const User = require("../models/User");
const multer = require("multer");
const auth = require("../middleware/authMiddleware");
const path = require('path');

router.get("/", auth, async (req, res) => {
  const users = await User.find({ _id: { $ne: req.user.id } });
  res.json(users);
});

// Multer config for storing uploaded files in /uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({ storage });

// @route   PUT /api/profile
// @desc    Update user profile (e.g., username)
// @access  Private
router.put(
  "/profile",
  auth,
  upload.single("profilePicture"), // multer middleware to parse profilePicture file
  async (req, res) => {
    const { username } = req.body;

    try {
      let user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update username if provided and different
      if (username && username !== user.username) {
        const existingUser = await User.findOne({ username });
        if (
          existingUser &&
          existingUser._id.toString() !== user._id.toString()
        ) {
          return res.status(400).json({ message: "Username already taken." });
        }
        user.username = username;
      }

      // Update profile picture if file uploaded
      if (req.file) {
        user.profilePicture = `http://localhost:5000/uploads/${req.file.filename}`;
      }

      await user.save();

      res.json({
        message: "Profile updated successfully",
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          profilePicture: user.profilePicture || "",
        },
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route   GET /api/settings
// @desc    Get user settings
// @access  Private
router.get("/settings", auth, async (req, res) => {
  try {
    // In a real app, settings might be a sub-document or a separate model
    // For simplicity, let's assume user model has a 'settings' field
    const user = await User.findById(req.user.id).select("settings");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      settings: user.settings || {
        emailNotifications: true,
        pushNotifications: false,
        soundNotifications: true,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   PUT /api/settings
// @desc    Update user settings
// @access  Private
router.put("/settings", auth, async (req, res) => {
  const { emailNotifications, pushNotifications, soundNotifications } =
    req.body;

  try {
    let user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update settings object
    user.settings = {
      emailNotifications:
        emailNotifications !== undefined
          ? emailNotifications
          : user.settings?.emailNotifications,
      pushNotifications:
        pushNotifications !== undefined
          ? pushNotifications
          : user.settings?.pushNotifications,
      soundNotifications:
        soundNotifications !== undefined
          ? soundNotifications
          : user.settings?.soundNotifications,
    };

    await user.save();

    res.json({ message: "Settings updated successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
