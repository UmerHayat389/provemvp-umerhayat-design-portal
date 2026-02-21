const router = require("express").Router();
const { login, getMe, changePassword } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/login", login);
router.get("/me", protect, getMe);
router.post("/change-password", changePassword); // Forgot password endpoint

module.exports = router;