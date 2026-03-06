// backend/controllers/userController.js
const User = require("../models/User");

// ================================
// Get all users (admin management)
// ================================
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find() // fetch all users
      .select("_id name email role isActive");
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ================================
// Get active employees (for dropdown)
// ================================
exports.getEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: "Employee", isActive: true })
      .select("_id name email"); // only needed fields for dropdown
    res.json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ================================
// Create new Employee
// ================================
exports.createUser = async (req, res) => {
  try {
    const user = await User.create({ ...req.body, role: "Employee" });
    res.status(201).json(user);
  } catch (error) {
    console.error("Error creating user:", error.message);

    // Handle duplicate email error
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }

    res.status(500).json({ message: "Server error" });
  }
};

// ================================
// Update user
// ================================
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error updating user:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ================================
// Deactivate user
// ================================
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deactivated" });
  } catch (error) {
    console.error("Error deactivating user:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};