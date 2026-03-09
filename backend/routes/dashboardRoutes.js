// backend/routes/dashboardRoutes.js
const router = require('express').Router();
const { adminStats, employeeStats } = require('../controllers/dashboardController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/admin',    protect, adminOnly, adminStats);
router.get('/employee', protect,            employeeStats);

module.exports = router;