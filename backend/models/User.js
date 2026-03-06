// backend/models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String, unique: true },
    password: { type: String },
    role: {
      type: String,
      enum: ["Admin", "Employee"],
      default: "Employee",
    },
    department: { type: String },
    position: { type: String },
    salary: { type: Number },
    isActive: { type: Boolean, default: true },

    // Shift assignment
    shiftType: {
      type: String,
      enum: ["day", "night"],
      default: "day",
    },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ✅ SAFE MODEL EXPORT (FIXES OverwriteModelError)
const User = mongoose.models.User || mongoose.model("User", userSchema);

module.exports = User;