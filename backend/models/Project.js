// backend/models/Project.js
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true },
    description: { type: String, required: true },
    assignedTo:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    deadline:    { type: Date, required: true },
    startDate:   { type: Date, default: Date.now },

    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed', 'Delayed'],
      default: 'Not Started',
    },

    priority:    { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    notes:       { type: String, default: '' },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

// Auto-set status to Delayed if deadline passed and not completed
projectSchema.pre('save', function (next) {
  if (this.status !== 'Completed' && this.deadline && new Date() > this.deadline) {
    this.status = 'Delayed';
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);