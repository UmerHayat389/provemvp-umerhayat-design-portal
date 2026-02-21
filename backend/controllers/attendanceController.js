const Attendance = require("../models/Attendance");

// ── Helper: safely get userId from JWT decoded payload ────────────────────────
// Handles all common generateToken patterns:
//   jwt.sign({ id })      → req.user.id
//   jwt.sign({ _id })     → req.user._id
//   jwt.sign({ userId })  → req.user.userId
const getUserId = (req) => req.user.id || req.user._id || req.user.userId;

// POST /attendance/clock-in
exports.clockIn = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "User identity not found in token. Please log in again." });
    }

    // Prevent double clock-in — check if already clocked in today with no clock-out
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await Attendance.findOne({
      userId,
      clockIn: { $gte: today },
      clockOut: null,
    });

    if (existing) {
      return res.status(400).json({ message: "You are already clocked in." });
    }

    const record = await Attendance.create({
      userId,
      date: new Date(),
      clockIn: new Date(),
      status: "Present",
    });

    res.json({ message: "Clocked in successfully.", attendance: record });
  } catch (err) {
    console.error("Clock in error:", err);
    res.status(500).json({ message: "Server error during clock in.", error: err.message });
  }
};

// POST /attendance/clock-out
exports.clockOut = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "User identity not found in token. Please log in again." });
    }

    // Find the most recent open record (clocked in, not yet clocked out)
    const record = await Attendance.findOne({
      userId,
      clockOut: null,
    }).sort({ createdAt: -1 });

    if (!record) {
      return res.status(400).json({ message: "No active clock-in found. Please clock in first." });
    }

    record.clockOut = new Date();
    record.totalHours = (record.clockOut - record.clockIn) / 1000 / 60 / 60;
    await record.save();

    res.json({ message: "Clocked out successfully.", attendance: record });
  } catch (err) {
    console.error("Clock out error:", err);
    res.status(500).json({ message: "Server error during clock out.", error: err.message });
  }
};

// GET /attendance/my-records
exports.myRecords = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "User identity not found in token. Please log in again." });
    }

    const records = await Attendance.find({ userId }).sort({ date: -1 });
    res.json(records);
  } catch (err) {
    console.error("Fetch records error:", err);
    res.status(500).json({ message: "Server error fetching records.", error: err.message });
  }
};

// GET /attendance/all-records (Admin only)
exports.allRecords = async (req, res) => {
  try {
    const records = await Attendance.find()
      .populate("userId", "name email department position")
      .sort({ date: -1 });
    res.json(records);
  } catch (err) {
    console.error("Fetch all records error:", err);
    res.status(500).json({ message: "Server error fetching all records.", error: err.message });
  }
};

// POST /attendance/mark-status  body: { status: 'Present' | 'Absent' | 'Leave' }
exports.markStatus = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "User identity not found in token. Please log in again." });
    }

    const { status } = req.body;
    const validStatuses = ["Present", "Absent", "Leave"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status. Use Present, Absent, or Leave." });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Update today's record if exists, otherwise create a new one (upsert)
    const record = await Attendance.findOneAndUpdate(
      { userId, date: { $gte: today, $lt: tomorrow } },
      { status },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ message: `Attendance marked as ${status}.`, attendance: record });
  } catch (err) {
    console.error("Mark status error:", err);
    res.status(500).json({ message: "Server error marking attendance.", error: err.message });
  }
};