// backend/controllers/userController.js
const User = require('../models/User');
const emit = require('../utils/socketEmitter');

// ── Get all users ─────────────────────────────────────────────────────────────
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Get employees only (for dropdowns) ───────────────────────────────────────
exports.getEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: 'Employee', isActive: true }).select('-password');
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Create user ───────────────────────────────────────────────────────────────
exports.createUser = async (req, res) => {
  try {
    const exists = await User.findOne({ email: req.body.email });
    if (exists) return res.status(400).json({ message: 'Email already in use' });

    const user = await User.create(req.body);
    const safe = user.toObject(); delete safe.password;

    // Notify admin dashboard to refresh employee count
    req.io?.to('admin').emit('user:update', { action: 'created', userId: user._id });

    res.status(201).json({ message: 'User created', user: safe });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Update user ───────────────────────────────────────────────────────────────
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    req.io?.to('admin').emit('user:update', { action: 'updated', userId: user._id });

    res.json({ message: 'User updated', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Delete user ───────────────────────────────────────────────────────────────
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    req.io?.to('admin').emit('user:update', { action: 'deleted', userId: req.params.id });

    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};