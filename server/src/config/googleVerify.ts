// src/auth/googleVerify.ts
import { Database } from "../database";

export type GoogleProfile = {
  id: string;
  displayName: string;
  emails?: { value: string }[];
};

/**
 * Factory that creates a Passport-compatible Google OAuth verify callback.
 *
 * The returned function extracts the primary email from the Google profile,
 * performs a lookup on the provided `Database` instance, and returns
 * a `userData` object via Passport's `done` callback:
 *  - email: string (from profile)
 *  - fullName: profile.displayName
 *  - googleId: profile.id
 *  - isNewUser: boolean (true when no existing user is found)
 *  - role: preserved from existing user or `"Student"` by default
 *
 * Error handling:
 *  - Calls `done(Error)` if the profile has no email.
 *  - Calls `done(err)` if the database lookup throws.
 *
 * Notes:
 *  - This factory does not persist new users; if you want to insert new
 *    users into the DB, perform an insert when `existingUser` is null.
 *  - Designed to be used as `passport.use(new GoogleStrategy(opts, makeGoogleVerify(database)))`.
 *
 * @param database - Database abstraction used to query user records.
 * @returns Passport verify callback `(accessToken, refreshToken, profile, done) => Promise<void>`.
 */
export const makeGoogleVerify =
  (database: Database) =>
  async (
    _accessToken: string,
    _refreshToken: string,
    profile: GoogleProfile,
    done: (err: any, user?: any) => void
  ) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) return done(new Error("No email found in profile"));

      const existingUser = await database.getUserByEmail(email);
      const userData = {
        email,
        fullName: existingUser?.fullName ?? profile.displayName,
        googleId: profile.id,
        isNewUser: !existingUser,
        role: existingUser?.role ?? "student",
      };
      return done(null, userData);
    } catch (e) {
      return done(e);
    }
  };
