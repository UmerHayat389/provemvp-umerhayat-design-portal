const User = require("../models/User");

exports.getUsers = async (req, res) => {
  const users = await User.find({ role: "Employee", isActive: true });
  res.json(users);
};

exports.createUser = async (req, res) => {
  const user = await User.create({ ...req.body, role: "Employee" });
  res.json(user);
};

exports.updateUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(user);
};

exports.deleteUser = async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ message: "User deactivated" });
};
