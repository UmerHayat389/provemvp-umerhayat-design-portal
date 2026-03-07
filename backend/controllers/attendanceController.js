// backend/controllers/attendanceController.js
const Attendance = require("../models/Attendance");
const User       = require("../models/User");

// ✅ FIX: safe optional chaining
const getUserId = (req) => req.user?.id || req.user?._id || req.user?.userId;

/* ══════════════════════════════════════════════════════════════════════
   PAKISTAN SHIFT WINDOWS  (PKT = UTC+5)
   Day   shift : 08:00 – 17:00  PKT
   Night shift : 20:00 – 05:00  PKT  (crosses midnight)
══════════════════════════════════════════════════════════════════════ */
function getPKTHour() {
  const now   = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcMs + 5 * 3600000).getHours();
}

function isWithinShift(shiftType) {
  const h = getPKTHour();
  if (shiftType === "night") return h >= 20 || h < 5;
  return h >= 8 && h < 17;
}

function shiftWindow(shiftType) {
  return shiftType === "night"
    ? "Night Shift (08:00 PM – 05:00 AM PKT)"
    : "Day Shift (08:00 AM – 05:00 PM PKT)";
}

function nextShiftTime(shiftType) {
  return shiftType === "night" ? "08:00 PM PKT" : "08:00 AM PKT";
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /attendance/clock-in
// ─────────────────────────────────────────────────────────────────────────────
exports.clockIn = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "User identity not found." });

    const employee = await User.findById(userId).select("shiftType name role");
    const shift    = employee?.shiftType || "day";
    const role     = employee?.role || "Employee";

    // ✅ FIX: check both "Admin" and "admin" for role comparison
    const isAdmin = role === "Admin" || role === "admin";

    if (!isAdmin && !isWithinShift(shift)) {
      return res.status(403).json({
        message: `Clock-in is only allowed during your assigned ${shiftWindow(shift)}. Next window opens at ${nextShiftTime(shift)}.`,
      });
    }

    const today    = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    const existing = await Attendance.findOne({
      userId,
      date:     { $gte: today, $lt: tomorrow },
      clockOut: null,
    });
    if (existing) return res.status(400).json({ message: "You are already clocked in." });

    const record = await Attendance.create({
      userId,
      date:          new Date(),
      clockIn:       new Date(),
      status:        "Present",
      markedByAdmin: false,
    });

    res.json({ message: "Clocked in successfully.", attendance: record });
  } catch (err) {
    console.error("Clock in error:", err);
    res.status(500).json({ message: "Server error during clock in.", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /attendance/clock-out
// ─────────────────────────────────────────────────────────────────────────────
exports.clockOut = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "User identity not found." });

    const record = await Attendance.findOne({ userId, clockOut: null }).sort({ createdAt: -1 });
    if (!record) return res.status(400).json({ message: "No active clock-in found." });

    record.clockOut   = new Date();
    record.totalHours = (record.clockOut - record.clockIn) / 3600000;
    await record.save();

    res.json({ message: "Clocked out successfully.", attendance: record });
  } catch (err) {
    console.error("Clock out error:", err);
    res.status(500).json({ message: "Server error during clock out.", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /attendance/my-records
// ─────────────────────────────────────────────────────────────────────────────
exports.myRecords = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "User identity not found." });

    const records = await Attendance.find({ userId }).sort({ date: -1 });
    // ✅ FIX: always return array
    res.json(Array.isArray(records) ? records : []);
  } catch (err) {
    res.status(500).json({ message: "Server error fetching records.", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /attendance/all-records  (Admin only)
// ─────────────────────────────────────────────────────────────────────────────
exports.allRecords = async (req, res) => {
  try {
    const records = await Attendance.find()
      .populate("userId", "name email department position createdAt joiningDate shiftType")
      .sort({ date: -1 });

    // ✅ FIX: always return array so frontend never crashes
    res.json(Array.isArray(records) ? records : []);
  } catch (err) {
    res.status(500).json({ message: "Server error fetching all records.", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /attendance/mark-status
// ─────────────────────────────────────────────────────────────────────────────
exports.markStatus = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "User identity not found." });

    const { status } = req.body;
    if (!["Present", "Absent", "Leave"].includes(status)) {
      return res.status(400).json({ message: "Invalid status." });
    }

    const employee = await User.findById(userId).select("shiftType role");
    const shift    = employee?.shiftType || "day";
    const role     = employee?.role || "Employee";
    const isAdmin  = role === "Admin" || role === "admin";

    if (!isAdmin && !isWithinShift(shift)) {
      return res.status(403).json({
        message: `Attendance marking is only allowed during your assigned ${shiftWindow(shift)}. Next window opens at ${nextShiftTime(shift)}.`,
      });
    }

    const today    = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    const existing = await Attendance.findOne({ userId, date: { $gte: today, $lt: tomorrow } });
    if (existing?.markedByAdmin) {
      return res.status(403).json({
        message: "Attendance for today has been set by admin and cannot be changed.",
      });
    }

    const record = await Attendance.findOneAndUpdate(
      { userId, date: { $gte: today, $lt: tomorrow } },
      { status, markedByAdmin: false },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ message: `Attendance marked as ${status}.`, attendance: record });
  } catch (err) {
    console.error("Mark status error:", err);
    res.status(500).json({ message: "Server error marking attendance.", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /attendance/admin-mark-status  (Admin only)
// ─────────────────────────────────────────────────────────────────────────────
exports.adminMarkStatus = async (req, res) => {
  try {
    const { userId, date, status } = req.body;

    if (!userId || !date || !status) {
      return res.status(400).json({ message: "userId, date, and status are required." });
    }
    if (!["Present", "Absent", "Leave"].includes(status)) {
      return res.status(400).json({ message: "Invalid status." });
    }

    const employee = await User.findById(userId);
    if (!employee) return res.status(404).json({ message: "Employee not found." });

    const joinDate = employee.joiningDate || employee.createdAt;
    if (joinDate) {
      const jd = new Date(joinDate); jd.setHours(0, 0, 0, 0);
      const td = new Date(date);     td.setHours(0, 0, 0, 0);
      if (td < jd) {
        return res.status(400).json({
          message: `Cannot mark attendance before the employee's joining date (${jd.toDateString()}).`,
        });
      }
    }

    const targetDate = new Date(date); targetDate.setHours(0, 0, 0, 0);
    const nextDay    = new Date(targetDate); nextDay.setDate(nextDay.getDate() + 1);

    const allForDay = await Attendance.find({ userId, date: { $gte: targetDate, $lt: nextDay } });
    if (allForDay.length > 1) {
      const sorted      = allForDay.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const idsToDelete = sorted.slice(1).map((r) => r._id);
      await Attendance.deleteMany({ _id: { $in: idsToDelete } });
    }

    const clockInTime =
      status === "Present"
        ? (() => { const t = new Date(targetDate); t.setHours(9, 0, 0, 0); return t; })()
        : null;

    const record = await Attendance.findOneAndUpdate(
      { userId, date: { $gte: targetDate, $lt: nextDay } },
      {
        status,
        markedByAdmin: true,
        clockIn:       clockInTime,
        clockOut:      null,
        totalHours:    0,
        date:          targetDate,
        userId,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await record.populate("userId", "name email department position shiftType");
    res.json({ message: `Attendance marked as ${status}.`, attendance: record });
  } catch (err) {
    console.error("Admin mark error:", err);
    res.status(500).json({ message: "Server error marking attendance.", error: err.message });
  }
};