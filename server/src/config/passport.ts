import passport from "passport";
import { Strategy as GoogleStrategy, Strategy, VerifyCallback } from "passport-google-oauth20";
import { Collection } from "mongodb";
import { makeGoogleVerify } from "./googleVerify";
import { StrategyOptions } from "passport-google-oauth20";

export function configurePassport(users: Collection) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        callbackURL: process.env.BACKEND_URL + "/auth/google/callback",
      },
      makeGoogleVerify(users)
    )
  );

  passport.serializeUser((user: any, done) => done(null, user.email));
  passport.deserializeUser(async (email: string, done) => {
    try {
      const user = await users.findOne({ email });
      done(null, user);
    } catch (e) {
      done(e);
    }
  });
}
