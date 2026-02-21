const router = require("express").Router();
const { adminStats } = require("../controllers/dashboardController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.get("/admin", protect, adminOnly, adminStats);

module.exports = router;
