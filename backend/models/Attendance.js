// backend/models/Attendance.js
const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    userId:        { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    date:          { type: Date, default: Date.now },
    clockIn:       Date,
    clockOut:      Date,
    totalHours:    Number,
    status:        { type: String, default: "Present", enum: ["Present", "Absent", "Leave"] },
    // true = set by admin; employee cannot override an admin-marked record
    markedByAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Compound index: one record per user per day
attendanceSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model("Attendance", attendanceSchema);