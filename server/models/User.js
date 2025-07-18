const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  password: String,
  profilePicture: { type: String, default: "" }, 
  settings: {
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: false },
    soundNotifications: { type: Boolean, default: true },
  },
});

module.exports = mongoose.model("User", userSchema);
