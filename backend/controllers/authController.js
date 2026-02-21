const User = require("../models/User");
const generateToken = require("../utils/generateToken");

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "User not found" });

  const match = await user.matchPassword(password);
  if (!match) return res.status(400).json({ message: "Invalid password" });

  res.json({
    token: generateToken(user._id, user.role),
    user
  });
};

exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json(user);
};
