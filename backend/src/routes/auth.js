const express = require("express");
const router = express.Router();
const passport = require("../config/passport");
const { generateToken, requireAuth } = require("../middleware/auth");

// Step 1: Redirect user to Google login page
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

// Step 2: Google redirects back here after user approves
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/login?error=auth_failed`,
  }),
  (req, res) => {
    // User is authenticated — generate JWT
    const token = generateToken(req.user);

    // Redirect to frontend with token in URL
    // Frontend will grab it, store it, then clean the URL
    res.redirect(
      `${process.env.CLIENT_URL}/auth/callback?token=${token}`
    );
  }
);

// GET /api/auth/me — get current user from token
router.get("/me", requireAuth, async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// POST /api/auth/logout — client just discards the token
// (JWT is stateless — no server-side session to clear)
router.post("/logout", (req, res) => {
  res.json({ success: true, message: "Logged out successfully" });
});

module.exports = router;