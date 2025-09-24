import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { PostgresDatabase } from "../database/PostgresDatabase";

function extractNames(profile: any): { firstName: string; lastName: string } {
  const firstName =
    profile.name?.givenName ||
    profile.displayName?.split(" ")?.[0] ||
    profile.emails?.[0]?.value?.split("@")[0] ||
    "";

  const lastName =
    profile.name?.familyName ||
    profile.displayName?.split(" ")?.slice(1).join(" ") ||
    "";

  return { firstName, lastName };
}

export function configurePassport(database: PostgresDatabase) {
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

          const { firstName, lastName } = extractNames(profile);

          const existingUser = await database.findUserByEmail(email);

          const userData = {
            email,
            name,
            firstName,
            lastName,
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
      const user = await database.findUserByEmail(email);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
}
