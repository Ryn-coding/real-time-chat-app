const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const socketIo = require("socket.io");

const authRoutes = require("./routes/authRoutes");
const Message = require("./models/Message");
const messageRoutes = require("./routes/messageRoutes");
const userRoutes = require("./routes/userRoutes");
const onlineUsers = new Map();
const uploadRoutes = require("./routes/uploadRoutes");
const groupRoutes = require("./routes/groupRoutes");
const groupMessages = require("./routes/groupMessages");

dotenv.config();
const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173", // React
    methods: ["GET", "POST"],
  },
});

app.set("io", io);

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoutes);
// Serve static files from /uploads
app.use("/uploads", express.static("uploads"));
app.use("/api/groups", groupRoutes);
app.use("/api/group-messages", groupMessages);

// Connect MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(console.error);

// Socket.IO logic
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
    onlineUsers.set(userId, socket.id);
    io.emit("online-users", Array.from(onlineUsers.keys()));
  });

  socket.on(
    "send-message",
    async ({
      _id: tempId,
      to,
      from,
      content,
      fileUrl,
      fileType,
      timestamp,
    }) => {
      try {
        const msg = await Message.create({
          sender: from,
          receiver: to,
          content,
          fileUrl,
          fileType,
          timestamp: timestamp || new Date(),
        });

        // Emit message to receiver
        io.to(to).emit("receive-message", {
          _id: msg._id,
          from,
          to,
          content,
          fileUrl,
          fileType,
          timestamp: msg.timestamp,
          delivered: false,
          seenBy: [],
        });

        // Emit confirmation back to sender with real DB _id
        socket.emit("message-sent-confirmation", {
          tempId,
          realId: msg._id.toString(),
        });
      } catch (error) {
        console.error("Error saving message:", error);
      }
    }
  );

  socket.on("message-delivered", async ({ messageId, receiverId }) => {
    try {
      await Message.findByIdAndUpdate(messageId, { delivered: true });
      io.to(receiverId).emit("message-status-updated", {
        messageId,
        delivered: true,
      });
    } catch (err) {
      console.error("Delivery update error:", err);
    }
  });

  socket.on("message-seen", async ({ messageId, userId }) => {
    try {
      const message = await Message.findById(messageId);
      if (!message) return;

      if (!message.seenBy.includes(userId)) {
        message.seenBy.push(userId);
        await message.save();

        io.to(message.sender).emit("message-status-updated", {
          messageId,
          seenBy: message.seenBy,
        });
      }
    } catch (err) {
      console.error("Seen update error:", err);
    }
  });

  socket.on("typing", ({ to, from }) => {
    socket.to(to).emit("typing", { from });
  });
  socket.on("stop-typing", ({ to, from }) => {
    socket.to(to).emit("stop-typing", { from });
  });

  socket.on("message-edited", ({ msgId, content }) => {
    setChat((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, content } : m))
    );
  });
  socket.on("message-deleted", ({ msgId }) => {
    setChat((prev) => prev.filter((m) => m.id !== msgId));
  });

  // 💬 Handle reaction to a message
  socket.on("react-message", async ({ messageId, emoji, userId }) => {
    try {
      const message = await Message.findById(messageId);
      if (!message) return;

      const existingIndex = message.reactions.findIndex(
        (r) => r.userId.toString() === userId
      );

      if (existingIndex !== -1) {
        if (message.reactions[existingIndex].emoji === emoji) {
          // ➖ Remove existing reaction
          message.reactions.splice(existingIndex, 1);
        } else {
          // 🔁 Change reaction emoji
          message.reactions[existingIndex].emoji = emoji;
        }
      } else {
        // ➕ Add new reaction
        message.reactions.push({ userId, emoji });
      }

      await message.save();

      // 🟢 Emit update to both sender and receiver (or room)
      io.to(message.sender).emit("message-reacted", {
        messageId,
        reactions: message.reactions,
      });

      io.to(message.receiver).emit("message-reacted", {
        messageId,
        reactions: message.reactions,
      });
    } catch (err) {
      console.error("Reaction error:", err);
    }
  });

  socket.on("join-group", (groupId) => {
    socket.join(groupId);
  });

  socket.on("send-group-message", async (msg) => {
    const newMsg = new Message({
      sender: msg.sender,
      receiver: msg.groupId, // Use groupId as receiver
      content: msg.content,
      fileUrl: msg.fileUrl || "",
      fileType: msg.fileType || "",
    });

    await newMsg.save();
    io.to(msg.groupId).emit("receive-group-message", newMsg);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }

    io.emit("online-users", Array.from(onlineUsers.keys()));
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
