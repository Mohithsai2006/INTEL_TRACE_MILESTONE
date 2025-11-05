const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

module.exports = function (passport) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback', // Must match Google Console
        proxy: true // Trust proxy
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // 1. Check if user already exists via Google ID
          let user = await User.findOne({ googleId: profile.id });
          if (user) {
            return done(null, user);
          }

          // 2. Check if user already exists via email
          // If so, link their Google account
          user = await User.findOne({ email: profile.emails[0].value });
          if (user) {
            user.googleId = profile.id;
            await user.save();
            return done(null, user);
          }

          // 3. Create a new user
          const newUser = new User({
            googleId: profile.id,
            username: profile.displayName,
            email: profile.emails[0].value,
            // Password is not required due to our model change
          });

          await newUser.save();
          return done(null, newUser);
          
        } catch (err) {
          console.error(err);
          return done(err, false);
        }
      }
    )
  );
};