// backend/controllers/leaveController.js
const Leave = require('../models/Leave');
const emit  = require('../utils/socketEmitter');

// ── Apply for leave (Employee) ────────────────────────────────────────────────
exports.applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason, description, days } = req.body;

    const leave = await Leave.create({
      userId: req.user._id,
      leaveType,
      startDate,
      endDate,
      reason,
      description,
      days,
      status: 'Pending',
    });

    // Notify admin room
    emit(req, 'leave:update', { userId: req.user._id, action: 'apply', leaveId: leave._id });

    res.status(201).json({ message: 'Leave applied successfully', leave });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Get all leaves (Admin) ────────────────────────────────────────────────────
exports.getLeaves = async (req, res) => {
  try {
    const leaves = await Leave
      .find()
      .populate('userId', 'name email department')
      .sort({ createdAt: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Get my leaves (Employee) ──────────────────────────────────────────────────
exports.getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave
      .find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Update leave status (Admin) ───────────────────────────────────────────────
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const leave = await Leave.findById(req.params.id);

    if (!leave) return res.status(404).json({ message: 'Leave not found' });

    leave.status     = status;
    leave.approvedBy = req.user._id;
    await leave.save();

    // Notify both admin room and the employee who applied
    emit(req, 'leave:update', {
      userId:  leave.userId,
      action:  'statusChange',
      status,
      leaveId: leave._id,
    });

    res.json({ message: 'Leave status updated', leave });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};