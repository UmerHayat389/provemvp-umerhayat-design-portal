const router = require("express").Router();
const {
  clockIn,
  clockOut,
  myRecords,
  allRecords,
  markStatus,
} = require("../controllers/attendanceController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.post("/clock-in",    protect,            clockIn);
router.post("/clock-out",   protect,            clockOut);
router.get("/my-records",   protect,            myRecords);
router.get("/all-records",  protect, adminOnly, allRecords);  // Admin only
router.post("/mark-status", protect,            markStatus);

module.exports = router;