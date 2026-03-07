// backend/controllers/profileController.js
const User = require("../models/User");

// GET /api/profile/me
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id || req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// PUT /api/profile/update
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const {
      phone,
      address,
      description,
      linkedin,
      github,
      profilePhoto, // base64 string
    } = req.body;

    const updateFields = {};
    if (phone !== undefined) updateFields.phone = phone;
    if (address !== undefined) updateFields.address = address;
    if (description !== undefined) updateFields.description = description;
    if (linkedin !== undefined) updateFields.linkedin = linkedin;
    if (github !== undefined) updateFields.github = github;
    if (profilePhoto !== undefined) updateFields.profilePhoto = profilePhoto;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: false }
    ).select("-password");

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};