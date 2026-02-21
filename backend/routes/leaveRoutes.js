const router = require("express").Router();
const { applyLeave, getLeaves, updateStatus } = require("../controllers/leaveController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.post("/", protect, applyLeave);
router.get("/", protect, adminOnly, getLeaves);
router.put("/:id/status", protect, adminOnly, updateStatus);

module.exports = router;
