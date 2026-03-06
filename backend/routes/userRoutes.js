// backend/routes/userRoutes.js
const router = require("express").Router();
const {
  getUsers,
  getEmployees,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/userController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// ================================
// Admin routes for managing users
// ================================
router.get("/", protect, adminOnly, getUsers); // All users
router.post("/", protect, adminOnly, createUser);
router.put("/:id", protect, adminOnly, updateUser);
router.delete("/:id", protect, adminOnly, deleteUser);

// ================================
// Route specifically for dropdown
// ================================
router.get("/employees", protect, adminOnly, getEmployees); 

module.exports = router;