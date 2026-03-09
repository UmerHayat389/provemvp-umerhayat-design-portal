// backend/controllers/projectController.js
const Project = require('../models/Project');
const emit    = require('../utils/socketEmitter');

// ── All projects (Admin) ──────────────────────────────────────────────────────
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project
      .find()
      .populate('team.userId', 'name email department')
      .populate('assignedBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ projects });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Project stats (Admin) ─────────────────────────────────────────────────────
exports.getProjectStats = async (req, res) => {
  try {
    const [total, completed, inProgress, notStarted] = await Promise.all([
      Project.countDocuments(),
      Project.countDocuments({ status: 'Completed'   }),
      Project.countDocuments({ status: 'In Progress' }),
      Project.countDocuments({ status: 'Not Started' }),
    ]);
    res.json({ total, completed, inProgress, notStarted });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Projects for a specific employee (Admin) ──────────────────────────────────
exports.getEmployeeProjects = async (req, res) => {
  try {
    const projects = await Project
      .find({ 'team.userId': req.params.id })
      .populate('assignedBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ projects });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Create project (Admin) ────────────────────────────────────────────────────
exports.createProject = async (req, res) => {
  try {
    const project = await Project.create({
      ...req.body,
      assignedBy: req.user._id,
    });

    // Notify all team members and admin
    const teamUserIds = (project.team ?? []).map(m => String(m.userId));
    for (const uid of teamUserIds) {
      req.io?.to(uid).emit('project:update', { action: 'created', projectId: project._id });
    }
    req.io?.to('admin').emit('project:update', { action: 'created', projectId: project._id });

    res.status(201).json({ message: 'Project created', project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Update project (Admin) ────────────────────────────────────────────────────
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const teamUserIds = (project.team ?? []).map(m => String(m.userId));
    for (const uid of teamUserIds) {
      req.io?.to(uid).emit('project:update', { action: 'updated', projectId: project._id });
    }
    req.io?.to('admin').emit('project:update', { action: 'updated', projectId: project._id });

    res.json({ message: 'Project updated', project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Delete project (Admin) ────────────────────────────────────────────────────
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    req.io?.to('admin').emit('project:update', { action: 'deleted', projectId: req.params.id });

    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── My projects (Employee) ────────────────────────────────────────────────────
exports.getMyProjects = async (req, res) => {
  try {
    const projects = await Project
      .find({ 'team.userId': req.user._id })
      .populate('assignedBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ projects });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── My project stats (Employee) ───────────────────────────────────────────────
exports.getMyProjectStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const [total, completed, inProgress] = await Promise.all([
      Project.countDocuments({ 'team.userId': userId }),
      Project.countDocuments({ 'team.userId': userId, status: 'Completed'   }),
      Project.countDocuments({ 'team.userId': userId, status: 'In Progress' }),
    ]);
    const pending = total - completed - inProgress;
    res.json({ total, completed, inProgress, pending: Math.max(0, pending) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Update task status (Employee) ─────────────────────────────────────────────
exports.updateTaskStatus = async (req, res) => {
  try {
    const { taskId, status } = req.body;
    const userId  = req.user._id;
    const project = await Project.findById(req.params.id);

    if (!project) return res.status(404).json({ message: 'Project not found' });

    const member = project.team.find(m => String(m.userId) === String(userId));
    if (!member)  return res.status(403).json({ message: 'You are not on this project' });

    const task = member.tasks.id(taskId);
    if (!task)  return res.status(404).json({ message: 'Task not found' });

    task.status = status;
    if (status === 'Done') task.completedAt = new Date();
    await project.save();

    // Emit to this employee + admin
    emit(req, 'project:update', { userId, action: 'taskUpdate', projectId: project._id, taskId, status });

    res.json({ message: 'Task status updated', project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};