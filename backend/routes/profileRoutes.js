// backend/routes/profileRoutes.js
const router = require("express").Router();
const { getProfile, updateProfile } = require("../controllers/profileController");
const { protect } = require("../middleware/authMiddleware");

router.get("/me", protect, getProfile);
router.put("/update", protect, updateProfile);

module.exports = router;