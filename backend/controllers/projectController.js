// backend/controllers/projectController.js
const Project  = require('../models/Project');
const User     = require('../models/User');
const mongoose = require('mongoose');

// ── helper: attach "Delayed" status without mutating DB ───────────────────────
const withDelayed = (p) => {
  const obj = p.toObject ? p.toObject() : { ...p };
  if (obj.status !== 'Completed' && obj.deadline && new Date() > new Date(obj.deadline)) {
    obj.status = 'Delayed';
  }
  return obj;
};

// ── helper: compute overall project status from tasks ────────────────────────
const computeStatus = (project) => {
  if (project.status === 'Completed' || project.status === 'On Hold') return project.status;
  if (project.deadline && new Date() > new Date(project.deadline)) return 'Delayed';
  const allTasks = project.team.flatMap(m => m.tasks);
  if (!allTasks.length) return project.status;
  if (allTasks.every(t => t.status === 'Done')) return 'Completed';
  if (allTasks.some(t => t.status === 'In Progress' || t.status === 'Done')) return 'In Progress';
  return 'Not Started';
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/projects  —  Admin: all projects
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('team.userId',  'name email department position shiftType')
      .populate('assignedBy',   'name')
      .populate('assignedTo',   'name email department position') // legacy
      .sort({ createdAt: -1 });

    res.json({ success: true, projects: projects.map(withDelayed) });
  } catch (err) {
    console.error('GET ALL PROJECTS ERROR:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/projects/stats  —  Admin dashboard stats
// ─────────────────────────────────────────────────────────────────────────────
exports.getProjectStats = async (req, res) => {
  try {
    const all = await Project.find();
    const now = new Date();
    res.json({
      success: true,
      stats: {
        total:      all.length,
        completed:  all.filter(p => p.status === 'Completed').length,
        delayed:    all.filter(p => p.status !== 'Completed' && new Date(p.deadline) < now).length,
        inProgress: all.filter(p => p.status === 'In Progress').length,
        notStarted: all.filter(p => p.status === 'Not Started').length,
        onHold:     all.filter(p => p.status === 'On Hold').length,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/projects/employee/:id  —  Admin: projects for one employee
// ─────────────────────────────────────────────────────────────────────────────
exports.getEmployeeProjects = async (req, res) => {
  try {
    const projects = await Project.find({ 'team.userId': req.params.id })
      .populate('team.userId', 'name email department position')
      .populate('assignedBy',  'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, projects: projects.map(withDelayed) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/projects  —  Admin: create project with team + tasks
// Body: { title, description, deadline, startDate, priority, notes,
//         team: [{ userId, role, tasks: [{ title, description, priority, deadline }] }] }
// ─────────────────────────────────────────────────────────────────────────────
exports.createProject = async (req, res) => {
  try {
    const { title, description, deadline, startDate, priority, notes, team } = req.body;

    if (!title || !description || !deadline) {
      return res.status(400).json({ success: false, message: 'title, description and deadline are required.' });
    }

    if (!team || !Array.isArray(team) || team.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one team member is required.' });
    }

    // Validate every userId
    for (const m of team) {
      if (!m.userId || !mongoose.Types.ObjectId.isValid(m.userId)) {
        return res.status(400).json({ success: false, message: `Invalid userId: ${m.userId}` });
      }
      if (!m.role || !m.role.trim()) {
        return res.status(400).json({ success: false, message: 'Each team member must have a role.' });
      }
    }

    const project = await Project.create({
      title,
      description,
      team: team.map(m => ({
        userId: m.userId,
        role:   m.role.trim(),
        tasks:  (m.tasks || []).map(t => ({
          title:       t.title,
          description: t.description || '',
          priority:    t.priority    || 'Medium',
          deadline:    t.deadline    ? new Date(t.deadline) : undefined,
          status:      'To Do',
        })),
      })),
      assignedBy: req.user._id,
      deadline:   new Date(deadline),
      startDate:  startDate ? new Date(startDate) : new Date(),
      priority:   priority  || 'Medium',
      notes:      notes     || '',
      status:     'Not Started',
    });

    const populated = await Project.findById(project._id)
      .populate('team.userId', 'name email department position')
      .populate('assignedBy',  'name');

    // Notify each team member via socket
    if (req.io) {
      team.forEach(m => req.io.to(m.userId).emit('project:assigned', populated));
      req.io.emit('project:updated', populated);
    }

    res.status(201).json({ success: true, project: populated });
  } catch (err) {
    console.error('CREATE PROJECT ERROR:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/projects/:id  —  Admin: update project info / status / team / tasks
// ─────────────────────────────────────────────────────────────────────────────
exports.updateProject = async (req, res) => {
  try {
    const updates = { ...req.body };

    if (updates.status === 'Completed') updates.completedAt = new Date();
    if (updates.deadline) updates.deadline = new Date(updates.deadline);
    if (updates.startDate) updates.startDate = new Date(updates.startDate);

    // If team is being updated, validate and remap
    if (updates.team && Array.isArray(updates.team)) {
      updates.team = updates.team.map(m => ({
        userId: m.userId,
        role:   m.role,
        tasks:  (m.tasks || []).map(t => ({
          _id:         t._id,
          title:       t.title,
          description: t.description || '',
          priority:    t.priority    || 'Medium',
          deadline:    t.deadline    ? new Date(t.deadline) : undefined,
          status:      t.status      || 'To Do',
          completedAt: t.status === 'Done' && !t.completedAt ? new Date() : t.completedAt,
        })),
      }));
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )
      .populate('team.userId', 'name email department position')
      .populate('assignedBy',  'name');

    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    // Auto-compute status based on tasks
    const autoStatus = computeStatus(project);
    if (autoStatus !== project.status && !updates.status) {
      project.status = autoStatus;
      await project.save();
    }

    const result = withDelayed(project);

    if (req.io) {
      project.team.forEach(m => req.io.to(m.userId.toString()).emit('project:updated', result));
      req.io.emit('project:updated', result);
    }

    res.json({ success: true, project: result });
  } catch (err) {
    console.error('UPDATE PROJECT ERROR:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/projects/:id/task  —  Employee: update their own task status
// Body: { memberId (userId), taskId, status }
// ─────────────────────────────────────────────────────────────────────────────
exports.updateTaskStatus = async (req, res) => {
  try {
    const { taskId, status } = req.body;
    const userId = req.user._id.toString();

    if (!['To Do', 'In Progress', 'Done', 'Blocked'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid task status.' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    const member = project.team.find(m => m.userId.toString() === userId);
    if (!member) return res.status(403).json({ success: false, message: 'You are not part of this project.' });

    const task = member.tasks.id(taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    task.status      = status;
    task.completedAt = status === 'Done' ? new Date() : undefined;

    // Auto-update project status
    project.status = computeStatus(project);
    if (project.status === 'Completed') project.completedAt = new Date();

    await project.save();

    const populated = await Project.findById(project._id)
      .populate('team.userId', 'name email department position')
      .populate('assignedBy',  'name');

    if (req.io) req.io.emit('project:updated', populated);

    res.json({ success: true, project: populated });
  } catch (err) {
    console.error('UPDATE TASK ERROR:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/projects/:id  —  Admin
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (req.io) req.io.emit('project:deleted', { projectId: req.params.id });
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/projects/my-projects  —  Employee
// ─────────────────────────────────────────────────────────────────────────────
exports.getMyProjects = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const projects = await Project.find({ 'team.userId': req.user._id })
      .populate('team.userId', 'name email department position')
      .populate('assignedBy',  'name')
      .sort({ createdAt: -1 });

    // Only expose this employee's slice of each project
    const result = projects.map(p => {
      const obj    = withDelayed(p);
      const member = obj.team.find(m => m.userId?._id?.toString() === userId || m.userId?.toString() === userId);
      return { ...obj, myMember: member || null };
    });

    res.json({ success: true, projects: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/projects/my-stats  —  Employee
// ─────────────────────────────────────────────────────────────────────────────
exports.getMyProjectStats = async (req, res) => {
  try {
    const all = await Project.find({ 'team.userId': req.user._id });
    const now = new Date();
    res.json({
      success: true,
      stats: {
        total:      all.length,
        completed:  all.filter(p => p.status === 'Completed').length,
        delayed:    all.filter(p => p.status !== 'Completed' && new Date(p.deadline) < now).length,
        inProgress: all.filter(p => p.status === 'In Progress').length,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};