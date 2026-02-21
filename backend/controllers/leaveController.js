const Leave = require("../models/Leave");

exports.applyLeave = async (req, res) => {
  const leave = await Leave.create({ ...req.body, userId: req.user.id });
  res.json(leave);
};

exports.getLeaves = async (req, res) => {
  const leaves = await Leave.find().populate("userId", "name email");
  res.json(leaves);
};

exports.updateStatus = async (req, res) => {
  const leave = await Leave.findById(req.params.id);
  leave.status = req.body.status;
  leave.approvedBy = req.user.id;
  await leave.save();
  res.json(leave);
};
