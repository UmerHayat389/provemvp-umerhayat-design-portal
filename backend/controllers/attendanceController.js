// backend/controllers/attendanceController.js
const Attendance = require('../models/Attendance');
const emit       = require('../utils/socketEmitter');

// PKT = UTC+5 — compute the 24h window for a given moment in PKT
const PKT_OFFSET = 5 * 60 * 60 * 1000;
const pktDayBounds = (d = new Date()) => {
  const ms       = typeof d === 'number' ? d : d.getTime();
  const pktMs    = ms + PKT_OFFSET;
  const midnight = Math.floor(pktMs / 86400000) * 86400000; // PKT 00:00 in ms
  return {
    start: new Date(midnight - PKT_OFFSET),           // UTC equiv of PKT 00:00
    end:   new Date(midnight - PKT_OFFSET + 86400000 - 1), // UTC equiv of PKT 23:59:59.999
  };
};

// ── Clock In ──────────────────────────────────────────────────────────────────
exports.clockIn = async (req, res) => {
  try {
    const userId = req.user._id;
    const now    = new Date();
    const { start, end } = pktDayBounds(now);

    let record = await Attendance.findOne({
      userId,
      date: { $gte: start, $lte: end },
    });

    if (record?.markedByAdmin) {
      return res.status(400).json({ message: 'Admin has already marked your attendance today.' });
    }

    if (record?.clockIn) {
      return res.status(400).json({ message: 'Already clocked in today.' });
    }

    if (!record) {
      record = new Attendance({ userId, date: start, status: 'Present' });
    }

    record.clockIn = now;
    record.status  = 'Present';
    await record.save();

    emit(req, 'attendance:update', { userId, status: 'Present', action: 'clockIn' });

    res.json({ message: 'Clocked in successfully', record });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Clock Out ─────────────────────────────────────────────────────────────────
exports.clockOut = async (req, res) => {
  try {
    const userId = req.user._id;
    const now    = new Date();
    const { start, end } = pktDayBounds(now);

    const record = await Attendance.findOne({
      userId,
      date: { $gte: start, $lte: end },
    });

    if (!record?.clockIn) {
      return res.status(400).json({ message: 'You have not clocked in today.' });
    }
    if (record.clockOut) {
      return res.status(400).json({ message: 'Already clocked out today.' });
    }

    record.clockOut   = now;
    record.totalHours = ((now - record.clockIn) / 3_600_000).toFixed(2);
    await record.save();

    emit(req, 'attendance:update', { userId, status: 'Present', action: 'clockOut' });

    res.json({ message: 'Clocked out successfully', record });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── My Records ────────────────────────────────────────────────────────────────
exports.myRecords = async (req, res) => {
  try {
    const records = await Attendance
      .find({ userId: req.user._id })
      .sort({ date: -1 })
      .limit(60);
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── All Records (Admin) ───────────────────────────────────────────────────────
exports.allRecords = async (req, res) => {
  try {
    const records = await Attendance
      .find()
      .populate('userId', 'name email department')
      .sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Employee self-mark status (PKT-aware) ─────────────────────────────────────
exports.markStatus = async (req, res) => {
  try {
    const { status, date } = req.body;
    const userId     = req.user._id;

    // Always work in PKT (UTC+5) — compute the target day's full 24h window in UTC
    const pktOffset  = 5 * 60 * 60 * 1000;
    const baseMs     = date ? new Date(date).getTime() : Date.now();
    // PKT midnight of the target day
    const pktMidMs   = Math.floor((baseMs + pktOffset) / 86400000) * 86400000 - pktOffset;
    const dayStart   = new Date(pktMidMs);           // PKT 00:00 in UTC
    const dayEnd     = new Date(pktMidMs + 86400000 - 1); // PKT 23:59:59 in UTC

    let record = await Attendance.findOne({
      userId,
      date: { $gte: dayStart, $lte: dayEnd },
    });

    if (record?.markedByAdmin) {
      return res.status(400).json({ message: 'Admin has already marked your attendance.' });
    }

    // Don't overwrite any existing record with auto-absent
    if (record && status === 'Absent') {
      return res.status(400).json({ message: 'Attendance already recorded for this day.' });
    }

    if (!record) record = new Attendance({ userId, date: dayStart });
    record.status = status;
    await record.save();

    emit(req, 'attendance:update', { userId, status });

    res.json({ message: 'Status updated', record });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Admin mark status ─────────────────────────────────────────────────────────
exports.adminMarkStatus = async (req, res) => {
  try {
    const { userId, status, date } = req.body;
    const { start, end } = pktDayBounds(date ? new Date(date) : new Date());

    let record = await Attendance.findOne({
      userId,
      date: { $gte: start, $lte: end },
    });

    if (!record) record = new Attendance({ userId, date: start });
    record.status        = status;
    record.markedByAdmin = true;
    await record.save();

    emit(req, 'attendance:update', { userId, status, markedByAdmin: true });

    res.json({ message: 'Attendance marked by admin', record });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Repair: fix Absent records that have a clockIn (data corruption fix) ──────
exports.repairRecords = async (req, res) => {
  try {
    const result = await Attendance.updateMany(
      { clockIn: { $exists: true, $ne: null }, status: 'Absent', markedByAdmin: { $ne: true } },
      { $set: { status: 'Present' } }
    );
    res.json({ message: `Repaired ${result.modifiedCount} record(s)` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};