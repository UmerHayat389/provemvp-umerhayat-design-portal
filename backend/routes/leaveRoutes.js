const router = require("express").Router();
const {
  applyLeave,
  getLeaves,
  getMyLeaves,
  updateStatus,
} = require("../controllers/leaveController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// IMPORTANT: /my-leaves must be before /:id to avoid route conflict
router.get("/my-leaves", protect,            getMyLeaves);  // Employee: own leaves
router.get("/",          protect, adminOnly, getLeaves);    // Admin: all leaves
router.post("/",         protect,            applyLeave);   // Employee: apply
router.put("/:id/status",protect, adminOnly, updateStatus); // Admin: approve/reject

module.exports = router;