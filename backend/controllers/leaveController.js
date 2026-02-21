const Leave = require("../models/Leave");

// Helper — same safe userId resolution as attendanceController
const getUserId = (req) => req.user.id || req.user._id || req.user.userId;

// POST /leaves — Employee applies for leave
exports.applyLeave = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { leaveType, startDate, endDate, reason, description } = req.body;

    if (!startDate || !endDate || !reason) {
      return res.status(400).json({ message: "startDate, endDate, and reason are required." });
    }

    const start = new Date(startDate);
    const end   = new Date(endDate);

    if (end < start) {
      return res.status(400).json({ message: "End date must be after start date." });
    }

    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const leave = await Leave.create({
      userId,
      leaveType: leaveType || "Sick Leave",
      startDate: start,
      endDate:   end,
      reason,
      description: description || "",
      days,
      status: "Pending",
    });

    res.json({ message: "Leave application submitted.", leave });
  } catch (err) {
    console.error("Apply leave error:", err);
    res.status(500).json({ message: "Server error applying for leave.", error: err.message });
  }
};

// GET /leaves — Admin gets ALL leaves
exports.getLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find()
      .populate("userId",     "name email department position")
      .populate("approvedBy", "name")
      .sort({ createdAt: -1 });
    res.json(leaves);
  } catch (err) {
    console.error("Get leaves error:", err);
    res.status(500).json({ message: "Server error fetching leaves.", error: err.message });
  }
};

// GET /leaves/my-leaves — Employee gets their own leaves
exports.getMyLeaves = async (req, res) => {
  try {
    const userId = getUserId(req);
    const leaves = await Leave.find({ userId }).sort({ createdAt: -1 });
    res.json(leaves);
  } catch (err) {
    console.error("Get my leaves error:", err);
    res.status(500).json({ message: "Server error fetching your leaves.", error: err.message });
  }
};

// PUT /leaves/:id/status — Admin approves or rejects
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["Pending", "Approved", "Rejected", "Delayed"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status." });
    }

    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ message: "Leave request not found." });
    }

    leave.status     = status;
    leave.approvedBy = getUserId(req);
    await leave.save();

    res.json({ message: `Leave ${status.toLowerCase()} successfully.`, leave });
  } catch (err) {
    console.error("Update status error:", err);
    res.status(500).json({ message: "Server error updating leave status.", error: err.message });
  }
};