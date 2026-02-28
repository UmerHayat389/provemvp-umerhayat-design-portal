const router = require("express").Router();
const {
  clockIn,
  clockOut,
  myRecords,
  allRecords,
  markStatus,
  adminMarkStatus,  // ✅ ADD THIS
} = require("../controllers/attendanceController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.post("/clock-in",    protect,            clockIn);
router.post("/clock-out",   protect,            clockOut);
router.get("/my-records",   protect,            myRecords);
router.get("/all-records",  protect, adminOnly, allRecords);  // Admin only
router.post("/mark-status", protect,            markStatus);

// ✅ ADD THIS NEW ROUTE
router.post("/admin-mark-status", protect, adminOnly, adminMarkStatus);  // Admin marks for any employee

module.exports = router;