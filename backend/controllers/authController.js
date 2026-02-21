const User = require("../models/User");
const generateToken = require("../utils/generateToken");

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "User not found" });

  const match = await user.matchPassword(password);
  if (!match) return res.status(400).json({ message: "Invalid password" });

  res.json({
    token: generateToken(user._id, user.role),
    user
  });
};

exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json(user);
};

exports.changePassword = async (req, res) => {
  const { email, oldPassword, newPassword } = req.body;

  // 1. Validate required fields
  if (!email || !oldPassword || !newPassword) {
    return res.status(400).json({ message: "Email, old password and new password are required." });
  }

  // 2. Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "No account found with this email." });
  }

  // 3. Verify old password matches
  const match = await user.matchPassword(oldPassword);
  if (!match) {
    return res.status(400).json({ message: "Current password is incorrect." });
  }

  // 4. Make sure new password is different
  const sameAsOld = await user.matchPassword(newPassword);
  if (sameAsOld) {
    return res.status(400).json({ message: "New password must be different from current password." });
  }

  // 5. Update password — the User model's pre-save hook will hash it automatically
  user.password = newPassword;
  await user.save();

  res.json({ message: "Password updated successfully." });
};