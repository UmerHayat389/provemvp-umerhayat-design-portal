// backend/controllers/authController.js
const User          = require("../models/User");
const generateToken = require("../utils/generateToken");

// POST /auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const match = await user.matchPassword(password);
    if (!match) {
      return res.status(400).json({ message: "Invalid password" });
    }

    res.json({
      token: generateToken(user._id, user.role),
      user: {
        _id:        user._id,
        name:       user.name,
        email:      user.email,
        role:       user.role,
        department: user.department,
        position:   user.position,
        shiftType:  user.shiftType,
        isActive:   user.isActive,
      },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Server error during login.", error: err.message });
  }
};

// GET /auth/me
exports.getMe = async (req, res) => {
  try {
    // ✅ FIX: use optional chaining — req.user.id can be undefined
    const userId = req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error("GetMe error:", err.message);
    res.status(500).json({ message: "Server error.", error: err.message });
  }
};

// POST /auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;

    if (!email || !oldPassword || !newPassword) {
      return res.status(400).json({ message: "Email, old password and new password are required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "No account found with this email." });
    }

    const match = await user.matchPassword(oldPassword);
    if (!match) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    const sameAsOld = await user.matchPassword(newPassword);
    if (sameAsOld) {
      return res.status(400).json({ message: "New password must be different from current password." });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password updated successfully." });
  } catch (err) {
    console.error("Change password error:", err.message);
    res.status(500).json({ message: "Server error.", error: err.message });
  }
};