// backend/server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const bcrypt = require("bcryptjs");

dotenv.config();

const app = express();

// Middleware
app.use(express.json({ limit: "10mb" })); // ✅ Increased limit for base64 profile photos
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(
  cors({
    origin: function (origin, callback) {
      const allowed = [
        process.env.FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
      ].filter(Boolean);
      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        console.warn("CORS blocked origin:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// 🔥 MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
  });

// Routes
app.use("/api/auth",       require("./routes/authRoutes"));
app.use("/api/users",      require("./routes/userRoutes"));
app.use("/api/attendance", require("./routes/attendanceRoutes"));
app.use("/api/leaves",     require("./routes/leaveRoutes"));
app.use("/api/dashboard",  require("./routes/dashboardRoutes"));
app.use("/api/projects",   require("./routes/projectRoutes"));
app.use("/api/profile",    require("./routes/profileRoutes")); // ✅ NEW

const User = require("./models/User");

// 🔥 Create Default Admin
const createAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: "Admin" });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("abdurrehman1", 10);
      await User.create({
        name: "Abdur Rehman",
        email: "abdurrehman@gmail.com",
        password: hashedPassword,
        role: "Admin",
      });
      console.log("✅ Default Admin Created");
    }
  } catch (error) {
    console.error("❌ Error creating admin:", error.message);
  }
};

// ✅ Create HTTP server & attach Socket.IO
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      const allowed = [
        process.env.FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
      ].filter(Boolean);
      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  },
});

// ✅ Attach io to every request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ✅ Socket.IO connection handler
io.on("connection", (socket) => {
  console.log("✅ Socket client connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket client disconnected:", socket.id);
  });
});

// Start Server
const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await createAdmin();
});