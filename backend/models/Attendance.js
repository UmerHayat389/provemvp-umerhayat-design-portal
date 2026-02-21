const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    date: { type: Date, default: Date.now },
    clockIn: Date,
    clockOut: Date,
    totalHours: Number,
    status: { type: String, default: "Present" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Attendance", attendanceSchema);
