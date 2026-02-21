const router = require("express").Router();
const { clockIn, clockOut, myRecords } = require("../controllers/attendanceController");
const { protect } = require("../middleware/authMiddleware");

router.post("/clock-in", protect, clockIn);
router.post("/clock-out", protect, clockOut);
router.get("/my-records", protect, myRecords);

module.exports = router;
