const Attendance = require("../models/Attendance");

exports.clockIn = async (req, res) => {
  const record = await Attendance.create({
    userId: req.user.id,
    clockIn: new Date()
  });
  res.json(record);
};

exports.clockOut = async (req, res) => {
  const record = await Attendance.findOne({ userId: req.user.id }).sort({ createdAt: -1 });
  record.clockOut = new Date();
  record.totalHours = (record.clockOut - record.clockIn) / 1000 / 60 / 60;
  await record.save();
  res.json(record);
};

exports.myRecords = async (req, res) => {
  const records = await Attendance.find({ userId: req.user.id });
  res.json(records);
};
