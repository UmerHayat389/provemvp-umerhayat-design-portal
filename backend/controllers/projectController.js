const Project = require('../models/Project');
const User = require('../models/User');
const mongoose = require('mongoose');

// Helper: check if project is delayed
const checkDelayed = (project) => {
  if (
    project.status !== 'Completed' &&
    project.deadline &&
    new Date() > new Date(project.deadline)
  ) {
    return { ...project.toObject(), status: 'Delayed' };
  }
  return project.toObject();
};

// GET /api/projects — Admin: all projects
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('assignedTo', 'name email department position')
      .populate('assignedBy', 'name')
      .sort({ createdAt: -1 });

    const result = projects.map(checkDelayed);

    res.json({ success: true, projects: result });
  } catch (err) {
    console.log("GET ALL PROJECTS ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/projects/stats — Admin dashboard stats
exports.getProjectStats = async (req, res) => {
  try {
    const all = await Project.find();
    const now = new Date();

    const total = all.length;
    const completed = all.filter(p => p.status === 'Completed').length;
    const delayed = all.filter(
      p => p.status !== 'Completed' && new Date(p.deadline) < now
    ).length;
    const inProgress = all.filter(p => p.status === 'In Progress').length;
    const notStarted = all.filter(p => p.status === 'Not Started').length;

    res.json({
      success: true,
      stats: { total, completed, delayed, inProgress, notStarted }
    });
  } catch (err) {
    console.log("PROJECT STATS ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/projects/employee/:id — Admin: projects for one employee
exports.getEmployeeProjects = async (req, res) => {
  try {
    const projects = await Project.find({ assignedTo: req.params.id })
      .populate('assignedTo', 'name email department position')
      .populate('assignedBy', 'name')
      .sort({ createdAt: -1 });

    const result = projects.map(checkDelayed);

    res.json({ success: true, projects: result });
  } catch (err) {
    console.log("GET EMPLOYEE PROJECTS ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/projects — Admin: create & assign project
exports.createProject = async (req, res) => {
  try {
    let { title, description, assignedTo, deadline, priority, notes, startDate } = req.body;

    // ✅ Validate assignedTo
    if (!assignedTo) {
      return res.status(400).json({
        success: false,
        message: "Employee must be selected"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID"
      });
    }

    // ✅ Convert deadline to Date
    if (deadline) {
      deadline = new Date(deadline);
    }

    // ✅ Create project
    const project = await Project.create({
      title,
      description,
      assignedTo,
      assignedBy: req.user._id,
      deadline,
      priority,
      notes,
      startDate,
    });

    const populated = await project.populate([
      { path: 'assignedTo', select: 'name email department position' },
      { path: 'assignedBy', select: 'name' },
    ]);

    // ✅ Safe Socket.IO emit
    if (req.io) {
      req.io.to(assignedTo).emit('project:assigned', populated);
      req.io.emit('project:updated', populated);
    }

    res.status(201).json({ success: true, project: populated });

  } catch (err) {
    console.log("CREATE PROJECT ERROR:", err); // 🔥 Important
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/projects/:id — Admin: update project
exports.updateProject = async (req, res) => {
  try {
    const { status } = req.body;

    if (status === 'Completed') {
      req.body.completedAt = new Date();
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
      .populate('assignedTo', 'name email department position')
      .populate('assignedBy', 'name');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const result = checkDelayed(project);

    if (req.io) {
      req.io.to(project.assignedTo._id.toString()).emit('project:updated', result);
      req.io.emit('project:updated', result);
    }

    res.json({ success: true, project: result });

  } catch (err) {
    console.log("UPDATE PROJECT ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/projects/:id — Admin: delete project
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (req.io) {
      req.io.emit('project:deleted', { projectId: req.params.id });
    }

    res.json({ success: true, message: 'Project deleted' });

  } catch (err) {
    console.log("DELETE PROJECT ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/projects/my-projects — Employee
exports.getMyProjects = async (req, res) => {
  try {
    const projects = await Project.find({ assignedTo: req.user._id })
      .populate('assignedBy', 'name')
      .sort({ createdAt: -1 });

    const result = projects.map(checkDelayed);

    res.json({ success: true, projects: result });

  } catch (err) {
    console.log("GET MY PROJECTS ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/projects/my-stats — Employee stats
exports.getMyProjectStats = async (req, res) => {
  try {
    const all = await Project.find({ assignedTo: req.user._id });
    const now = new Date();

    const total = all.length;
    const completed = all.filter(p => p.status === 'Completed').length;
    const delayed = all.filter(
      p => p.status !== 'Completed' && new Date(p.deadline) < now
    ).length;
    const inProgress = all.filter(p => p.status === 'In Progress').length;

    res.json({
      success: true,
      stats: { total, completed, delayed, inProgress }
    });

  } catch (err) {
    console.log("GET MY PROJECT STATS ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
