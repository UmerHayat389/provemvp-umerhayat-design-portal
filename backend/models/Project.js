// backend/models/Project.js
const mongoose = require('mongoose');

// ── Task sub-schema (per team member) ────────────────────────────────────────
const taskSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  status: {
    type:    String,
    enum:    ['To Do', 'In Progress', 'Done', 'Blocked'],
    default: 'To Do',
  },
  priority:    { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  deadline:    { type: Date },
  completedAt: { type: Date },
}, { timestamps: true });

// ── Team member sub-schema ────────────────────────────────────────────────────
const teamMemberSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role:     { type: String, required: true }, // e.g. "Frontend Developer", "UI/UX Designer"
  tasks:    { type: [taskSchema], default: [] },
}, { _id: false });

// ── Project schema ────────────────────────────────────────────────────────────
const projectSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true },
    description: { type: String, required: true },

    // NEW: team is an array of members (replaces single assignedTo)
    team:        { type: [teamMemberSchema], default: [] },

    // Keep assignedBy for who created the project
    assignedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    deadline:    { type: Date, required: true },
    startDate:   { type: Date, default: Date.now },

    status: {
      type:    String,
      enum:    ['Not Started', 'In Progress', 'Completed', 'Delayed', 'On Hold'],
      default: 'Not Started',
    },

    priority:    { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    notes:       { type: String, default: '' },
    completedAt: { type: Date },

    // Legacy field kept for backward compat with old single-assign projects
    assignedTo:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);