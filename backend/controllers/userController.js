const User = require("../models/User");

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "Employee", isActive: true });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.createUser = async (req, res) => {
  try {
    const user = await User.create({ ...req.body, role: "Employee" });
    res.json(user);
  } catch (error) {
    // ✅ Handle duplicate email error
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Email already exists"
      });
    }

    res.status(500).json({ message: "Server error" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: "User deactivated" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};