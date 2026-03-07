// backend/controllers/userController.js
const User   = require("../models/User");
const bcrypt = require("bcryptjs");

// ================================
// GET /users — Employees only (no Admin)
// ================================
exports.getUsers = async (req, res) => {
  try {
    // ✅ FIX: filter role "Employee" only — Admin should never appear in employee lists
    const users = await User.find({ role: "Employee" })
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ================================
// GET /users/employees — Dropdown
// ================================
exports.getEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: "Employee", isActive: true })
      .select("_id name email department position shiftType");
    res.json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ================================
// POST /users — Create employee
// ================================
exports.createUser = async (req, res) => {
  try {
    const {
      name, email, password, department, position,
      salary, phone, address, hireDate, shiftType,
    } = req.body;

    const user = await User.create({
      name,
      email,
      password,
      role:        "Employee",
      department,
      position,
      salary,
      phone,
      address,
      hireDate,
      joiningDate: hireDate || new Date(),
      shiftType:   shiftType || "day",
      isActive:    true,
    });

    const userObj = user.toObject();
    delete userObj.password;
    res.status(201).json(userObj);
  } catch (error) {
    console.error("Error creating user:", error.message);
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// ================================
// PUT /users/:id — Update employee
// ================================
exports.updateUser = async (req, res) => {
  try {
    const updates = { ...req.body };

    if (updates.password) {
      const salt       = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(updates.password, salt);
    } else {
      delete updates.password;
    }

    if (updates.hireDate) {
      updates.joiningDate = updates.hireDate;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    console.error("Error updating user:", error.message);
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// ================================
// DELETE /users/:id — Hard delete
// ================================
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Employee deleted successfully." });
  } catch (error) {
    console.error("Error deleting user:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};