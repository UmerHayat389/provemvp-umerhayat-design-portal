const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema(
  {
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    leaveType:   { type: String, default: "Sick Leave" },
    startDate:   Date,
    endDate:     Date,
    reason:      String,
    description: String,
    days:        Number,
    status:      { type: String, default: "Pending" },
    approvedBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Leave", leaveSchema);