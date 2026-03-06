// backend/routes/projectRoutes.js
const router = require('express').Router();
const {
  getAllProjects,
  getProjectStats,
  getEmployeeProjects,
  createProject,
  updateProject,
  deleteProject,
  getMyProjects,
  getMyProjectStats,
} = require('../controllers/projectController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// ✅ Employee routes FIRST (before /:id routes)
router.get('/my-projects',      protect, getMyProjects);
router.get('/my-stats',         protect, getMyProjectStats);

// Admin routes
router.get('/stats',            protect, adminOnly, getProjectStats);
router.get('/employee/:id',     protect, adminOnly, getEmployeeProjects);
router.get('/',                 protect, adminOnly, getAllProjects);
router.post('/',                protect, adminOnly, createProject);
router.put('/:id',              protect, adminOnly, updateProject);
router.delete('/:id',           protect, adminOnly, deleteProject);

module.exports = router;