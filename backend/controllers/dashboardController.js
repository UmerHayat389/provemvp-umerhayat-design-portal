const User = require("../models/User");
const Leave = require("../models/Leave");

exports.adminStats = async (req, res) => {
  const totalEmployees = await User.countDocuments({ role: "Employee" });
  const pendingLeaves = await Leave.countDocuments({ status: "Pending" });
  res.json({ totalEmployees, pendingLeaves });
};
