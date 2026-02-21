const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const bcrypt = require("bcryptjs");

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors()); // simplified for development

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => {
  console.error("❌ MongoDB Connection Error:", err.message);
  process.exit(1);
});

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/attendance", require("./routes/attendanceRoutes"));
app.use("/api/leaves", require("./routes/leaveRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));

const User = require("./models/User");

// Create Default Admin (with hashed password)
const createAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: "Admin" });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("abdurrehman1", 10);

      await User.create({
        name: "Abdur Rehman",
        email: "abdurrehman@gmail.com",
        password: hashedPassword,
        role: "Admin"
      });

      console.log("✅ Default Admin Created");
    }
  } catch (error) {
    console.error("❌ Error creating admin:", error.message);
  }
};

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await createAdmin();
});