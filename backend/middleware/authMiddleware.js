// backend/middleware/authMiddleware.js

const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/user"); // ✅ FIX: correct file name

// ================================
// Protect Middleware
// ================================
exports.protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check token
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch full user from DB
    const user = await User.findById(decoded.id || decoded._id).select(
      "-password"
    );

    if (!user) {
      res.status(401);
      throw new Error("User not found");
    }

    // Attach user to request
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
exports.adminOnly = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: "Admin only" });
  }
  next();
};