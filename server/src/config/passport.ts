import passport from "passport";
import {
  Strategy as GoogleStrategy,
  Strategy,
  VerifyCallback,
} from "passport-google-oauth20";
import { Collection } from "mongodb";
import { makeGoogleVerify } from "./googleVerify";

/**
 * Configure Passport.js with Google OAuth strategy and session handlers.
 *
 * This function registers a `GoogleStrategy` that uses the provided
 * `users` collection via `makeGoogleVerify(users)` to verify Google profiles.
 * It also wires `serializeUser` / `deserializeUser` for session support.
 *
 * Notes:
 *  - Call this once during app startup after creating your MongoDB client
 *    and obtaining the `users` collection.
 *  - `serializeUser` stores the user's email in the session. `deserializeUser`
 *    looks up the full user document from `users` by email and attaches it to
 *    `req.user` for subsequent requests.
 *
 * @param users - MongoDB `Collection` used to find/insert user documents.
 */
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

  // Store a minimal identifier in the session (email). Keep the session small.
  passport.serializeUser((user: any, done) => done(null, user.email));

  // Resolve the full user object for each request from the users collection.
  passport.deserializeUser(async (email: string, done) => {
    try {
      const user = await users.findOne({ email });
      done(null, user);
    } catch (e) {
      done(e);
    }
  });
}
