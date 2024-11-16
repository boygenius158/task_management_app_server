// routes/authRoutes.js

const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/register-user", authController.registerUser);
router.post("/login-user", authController.loginUser);
router.get("/check-auth", authController.checkAuth);
router.post("/logout-user", authController.logoutUser);

module.exports = router;
