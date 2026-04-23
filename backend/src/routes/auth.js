const express = require("express");
const router = express.Router();

const passport = require("../config/passport");

const {
  generateToken,
  requireAuth,
} = require("../middleware/auth");

/**
 * STEP 1
 * Redirect user to Google login
 */
router.get(
  "/google",

  passport.authenticate("google", {
    scope: ["profile", "email"],

    // No express-session
    session: false,

    // Always show Google account picker
    prompt: "select_account",
  })
);

/**
 * STEP 2
 * Google redirects back here
 */
router.get(
  "/google/callback",

  passport.authenticate("google", {
    session: false,

    failureRedirect:
      `${process.env.CLIENT_URL}/login?error=auth_failed`,
  }),

  (req, res) => {
    try {
      /**
       * Generate JWT token
       */
      const token = generateToken(req.user);

      console.log("[Auth] JWT generated");

      /**
       * Redirect frontend WITH token
       */
      const redirectUrl =
        `${process.env.CLIENT_URL}/auth/callback?token=${encodeURIComponent(
          token
        )}`;

      console.log("[Auth] Redirecting to:", redirectUrl);

      res.redirect(redirectUrl);

    } catch (error) {
      console.error("[Auth] Callback error:", error);

      res.redirect(
        `${process.env.CLIENT_URL}/login?error=token_failed`
      );
    }
  }
);

/**
 * GET CURRENT USER
 */
router.get(
  "/me",
  requireAuth,

  async (req, res) => {
    res.json({
      success: true,
      user: req.user,
    });
  }
);

/**
 * LOGOUT
 * JWT is stateless
 * Frontend removes token locally
 */
router.post("/logout", (req, res) => {
  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

module.exports = router;