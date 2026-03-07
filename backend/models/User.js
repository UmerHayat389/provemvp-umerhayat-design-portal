// backend/models/User.js
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name:        { type: String },
    email:       { type: String, unique: true },
    password:    { type: String },
    role: {
      type:    String,
      enum:    ["Admin", "Employee"],
      default: "Employee",
    },
    department:  { type: String },
    position:    { type: String },
    salary:      { type: Number },
    isActive:    { type: Boolean, default: true },
    phone:       { type: String },
    address:     { type: String },
    hireDate:    { type: Date },
    joiningDate: { type: Date },
    shiftType: {
      type:    String,
      enum:    ["day", "night"],
      default: "day",
    },

    // ✅ NEW — Profile fields
    description:  { type: String, default: "" },
    linkedin:     { type: String, default: "" },
    github:       { type: String, default: "" },
    profilePhoto: { type: String, default: "" }, // base64 image string
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt    = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ✅ plain export — removes circular dependency that broke findOne/findById
module.exports = mongoose.model("User", userSchema);