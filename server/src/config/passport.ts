import passport from "passport";
import {
  Strategy as GoogleStrategy,
  Strategy,
  VerifyCallback,
} from "passport-google-oauth20";
import { makeGoogleVerify } from "./googleVerify";
import { Database } from "../database";

/**
 * Configure Passport.js with Google OAuth strategy and session handlers.
 *
 * This function registers a `GoogleStrategy` that uses the provided database
 * via `makeGoogleVerify(database)` to verify Google profiles.
 * It also wires `serializeUser` / `deserializeUser` for session support.
 *
 * Notes:
 *  - Call this once during app startup after creating your `Database`
 *    instance.
 *  - `serializeUser` stores the user's email in the session. `deserializeUser`
 *    looks up the full user document from the database by email and attaches
 *    it to `req.user` for subsequent requests.
 *
 * @param database - Database abstraction used to find/insert user records.
 */
export function configurePassport(database: Database) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        callbackURL: process.env.BACKEND_URL + "/auth/google/callback",
      },
      makeGoogleVerify(database)
    )
  );

  // Store a minimal identifier in the session (email). Keep the session small.
  passport.serializeUser((user: any, done) => done(null, user.email));

  // Resolve the full user object for each request from the users collection.
  passport.deserializeUser(async (email: string, done) => {
    try {
      const user = await database.getUserByEmail(email);
      done(null, user);
    } catch (e) {
      done(e);
    }
  });
}
