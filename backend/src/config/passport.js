const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Does this Google user already exist in our DB?
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // Update last login time
          user.lastLoginAt = new Date();
          await user.save();
          return done(null, user);
        }

        // First time this user has logged in — create them
        user = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          avatar: profile.photos?.[0]?.value || null,
        });

        console.log(`[Auth] New user registered: ${user.email}`);
        return done(null, user);

      } catch (error) {
        console.error("[Auth] Passport error:", error.message);
        return done(error, null);
      }
    }
  )
);

// Serialize/deserialize for session (minimal — we use JWT primarily)
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;