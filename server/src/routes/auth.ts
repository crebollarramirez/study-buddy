import { Request, Response, Router } from "express";
import passport from "passport";
import { Collection } from "mongodb";

interface AuthRouter {
  router: Router;
  initializeAuthRoutes: (users: Collection) => void;
}

interface User {
  email: string;
  name: string;
  googleId: string;
  isNewUser: boolean;
  role: string;
}

/**
 * Create and return an authentication router with lazy initialization.
 *
 * The returned object contains an Express `router` with all authentication
 * routes mounted and an `initializeAuthRoutes` function that must be called
 * with a MongoDB `Collection` instance used for user persistence. The
 * `initializeAuthRoutes` design allows the router to be created at import
 * time and wired up with the real collection later (useful for tests).
 *
 * Routes provided:
 *  - GET `/register`  -> stores role in session and redirects to `/auth/google`
 *  - GET `/login`     -> sets session hint and redirects to `/auth/google`
 *  - GET `/google`    -> passport.authenticate starter
 *  - GET `/google/callback` -> passport.authenticate callback + create user
 *  - GET `/logout`    -> logs out and redirects to client
 *  - GET `/isAuthenticated` -> returns { authenticated, account_type }
 *
 * @returns AuthRouter containing `router` and `initializeAuthRoutes(users)`.
 */
const createAuthRouter = (): AuthRouter => {
  const router = Router();
  let usersCollection: Collection;

  /**
   * Initialize the router with the `users` collection.
   *
   * This must be called before mounting the router in an Express app so that
   * the callback route can create or query users as needed.
   *
   * @param users - MongoDB `Collection` to use for user lookups and inserts.
   */
  const initializeAuthRoutes = (users: Collection) => {
    usersCollection = users;
  };

  // OAuth routes with passport.js
  router.get("/register", (req: Request, res: Response) => {
    const role = (req.query.role as string) || "student";

    console.log(`Registration initiated for role: ${role}`);
    // Pass role as query parameter to Google OAuth
    res.redirect(`google?role=${encodeURIComponent(role)}`);
  });

  router.get("/login", (req: Request, res: Response) => {
    // Set action as hint, but callback will handle user creation if needed

    console.log("Login initiated");
    res.redirect("google");
  });

  // Google OAuth routes
  router.get("/google", (req: Request, res: Response, next) => {
    // Extract role from query parameter and pass it through OAuth state
    const role = (req.query.role as string) || "student";

    // Use Passport's state parameter to preserve the role through OAuth
    passport.authenticate("google", {
      scope: ["profile", "email"],
      state: JSON.stringify({ role }),
    })(req, res, next);
  });

  router.get(
    "/google/callback",
    passport.authenticate("google", { failureRedirect: "/auth/login" }),
    async (req: Request, res: Response) => {
      try {
        // Passport has already authenticated and set req.user
        // The deserializeUser function should have loaded the full user data
        const user = req.user as User;

        console.log("=== AUTH CALLBACK DEBUG ===");
        console.log("1. Authenticated user:", user?.email);
        console.log("2. User data:", user);

        // Extract role from OAuth state parameter
        let role = "student"; // default
        try {
          const state = req.query.state as string;
          if (state) {
            const stateData = JSON.parse(state);
            role = stateData.role || "student";
            console.log(`Role from OAuth state: ${role}`);
          }
        } catch (error) {
          console.log(
            "Could not parse state parameter, using default role: student"
          );
        }

        if (user.isNewUser) {
          console.log(`3. Creating new user: ${user.email} with role: ${role}`);

          const newUser = {
            email: user.email,
            name: user.name,
            role: role,
            brain_points: 0,
            ...(role === "teacher" ? { prompt: null } : {}),
            createdAt: new Date(),
          };

          const result = await usersCollection.insertOne(newUser);
          console.log("4. New user created with ID:", result.insertedId);
        } else {
          console.log("3. Existing user logged in successfully");
        }

        console.log("4. Redirecting to client");
        console.log("=== AUTH CALLBACK END ===");

        res.redirect(process.env.CLIENT || "");
      } catch (error) {
        console.error("Error during authentication callback:", error);
        res.status(500).send("Authentication error");
      }
    }
  );

  router.get("/logout", (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        console.error("Passport logout error:", err);
        return res.status(500).send("Logout error");
      }

      console.log("User logged out successfully");
      res.redirect(process.env.CLIENT || "");
    });
  });

  router.get("/isAuthenticated", (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.json({ authenticated: false, account_type: null });
      }

      const user = req.user as any;
      res.json({ authenticated: true, account_type: user.role });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return { router, initializeAuthRoutes };
};

export default createAuthRouter;
