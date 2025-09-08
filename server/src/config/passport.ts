import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Collection } from "mongodb";

export function configurePassport(users: Collection) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        callbackURL: "http://localhost:3000/auth/google/callback", // Explicit localhost
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const name = profile.displayName;

          if (!email) {
            return done(new Error("No email found in profile"), undefined);
          }

          // Check if user exists
          const existingUser = await users.findOne({ email });

          const userData = {
            email,
            name,
            googleId: profile.id,
            isNewUser: !existingUser,
          };

          return done(null, userData);
        } catch (error) {
          return done(error, undefined);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.email);
  });

  passport.deserializeUser(async (email: string, done) => {
    try {
      const user = await users.findOne({ email });
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
}
