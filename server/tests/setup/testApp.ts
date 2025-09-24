import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import createAuthRouter from "src/routes/auth";
import "../../src/types/session";

// Mock collection for testing
export const mockCollection = {
  findOne: jest.fn(),
  insertOne: jest.fn(),
  updateOne: jest.fn(),
  find: jest.fn(),
};

export async function createTestApp() {
  const app = express();

  // Basic middleware
  app.use(express.json());
  app.use(
    cors({
      origin: process.env.CLIENT,
      credentials: true,
    })
  );

  // Session configuration for tests
  app.use(
    session({
      secret: "test-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
        secure: false,
        sameSite: "lax",
      },
    })
  );

  // Passport setup with mock
  app.use(passport.initialize());
  app.use(passport.session());

  // Mock passport configuration
  passport.serializeUser((user: any, done) => {
    done(null, user.email);
  });

  passport.deserializeUser(async (email: string, done) => {
    done(null, null); // For testing unauthenticated state
  });

  // Mock Google Strategy for tests
  const GoogleStrategy = require("passport-google-oauth20").Strategy;
  passport.use(
    new GoogleStrategy(
      {
        clientID: "mock-client-id",
        clientSecret: "mock-client-secret",
        callbackURL: "/auth/google/callback",
      },
      (accessToken: any, refreshToken: any, profile: any, done: any) => {
        // This won't actually be called in tests, but we need it to register the strategy
        done(null, profile);
      }
    )
  );

  // Auth routes with mock collection
  const authRouter = createAuthRouter();
  authRouter.initializeAuthRoutes(mockCollection as any);
  app.use("/auth", authRouter.router);

  // Expose the mock collection on the app for tests to inspect/override
  app.set("usersCollection", mockCollection);

  return app;
}

export async function closeTestApp() {
  // No real connections to close in this mock setup
  return Promise.resolve();
}
