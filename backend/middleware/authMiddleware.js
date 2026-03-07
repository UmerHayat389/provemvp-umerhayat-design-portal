// backend/middleware/authMiddleware.js
const jwt          = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User         = require("../models/User"); // ✅ FIX: correct case "User" not "user"

// ================================
// Protect Middleware
// ================================
exports.protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id || decoded._id).select("-password");

    if (!user) {
      res.status(401);
      throw new Error("User not found");
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    res.status(401);
    throw new Error("Not authorized, token failed");
  }
});

// ================================
// Admin Only Middleware
// ================================
// ✅ FIX: was checking req.user.isAdmin which does NOT exist in User schema
// Schema uses "role" field with values "Admin" or "Employee"
exports.adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const role = req.user.role || "";
  const isAdmin = role === "Admin" || role === "admin";

  if (!isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }

  next();
};