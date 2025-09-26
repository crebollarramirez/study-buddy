import express, { Request, Response } from "express";
import cors from "cors";
import session from "express-session";
import { Server } from "socket.io";
import { createServer } from "http";
import dotenv from "dotenv";
import OpenAI from "openai";
import passport from "passport";
import { Pool } from "pg";
import { configurePassport } from "./config/passport";
import { requireAuth, requireRole } from "./middleware";
import { initializeSocketHandlers } from "./socket/socketHandlers";
import createAuthRouter from "./routes/auth";
import { createBookRouter } from "./routes/book";
import "./types/session";
import { Database, DatabaseUser } from "./database";
import { SessionData } from "express-session";

// Load environment variables from .env file
dotenv.config();
const app = express();
const server = createServer(app);

// PostgreSQL setup
const POSTGRES_URL =
  process.env.POSTGRES_URL;
const database = new Database(POSTGRES_URL);

// OpenAI setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT,
    credentials: true,
  },
});

// Session configuration

const sessionMiddleware = session({
  secret: process.env.SECRET_KEY || "TEST",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    httpOnly: true,
    secure: false, // Set to true in production with HTTPS !!!!
    sameSite: "lax",
  },
});

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

// Share session middleware with Socket.IO
io.engine.use(sessionMiddleware);

// Initialize auth router
const authRouter = createAuthRouter();
const bookRouter = createBookRouter();

// Initialize application components that depend on database
async function initializeApp() {
  try {
    // Initialize the PostgreSQL database
    await database.initialize();

    // Configure Passport after database connection
    configurePassport(database);

    // Initialize auth routes with database access
    authRouter.initializeAuthRoutes(database);

    // Mount auth routes with /auth prefix
    app.use("/auth", authRouter.router);
    app.use("/book", bookRouter.router);

    // Initialize Socket.IO handlers with database collections
    initializeSocketHandlers(io, database, openai);

    console.log("Application initialized successfully");
  } catch (error) {
    console.error("Failed to initialize application:", error);
    process.exit(1);
  }
}

// Routes
app.get("/", requireAuth, (req: Request, res: Response) => {
  console.log("You were authorized");
  res.send("Welcome to the StudyBuddy API!");
});

// Debug route to check authentication
app.get("/debug/auth", (req: Request, res: Response) => {
  res.json({
    isAuthenticated: req.isAuthenticated(),
    user: req.user,
    session: req.session,
    sessionID: req.sessionID,
  });
});

app.get("/brain_points", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user as DatabaseUser;
    const dbUser = await database.getUserByEmail(user.email);
    if (dbUser) {
      res.json({ brain_points: dbUser.brain_points });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/students", async (req: Request, res: Response) => {
  try {
    const students = await database.getStudents();
    const response = students.map((student) => ({
      email: student.email,
      name: student.fullName,
      brain_points: student.brain_points,
    }));
    res.json({ students: response });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Example of role-based route (only teachers can access)
app.get(
  "/teacher-dashboard",
  requireRole("teacher"),
  async (req: Request, res: Response) => {
    try {
      const user = req.user as DatabaseUser;
      res.json({
        message: "Welcome to teacher dashboard",
        teacher: user.fullName,
        role: user.role,
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.post(
  "/bot/set-prompt",
  requireAuth,
  async (req: Request, res: Response) => {
    const { prompt } = req.body;
    const user = req.user as DatabaseUser;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    try {
      const dbUser = await database.getUserByEmail(user.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }

      await database.updatePrompt(user.email, prompt);
      res.json({ status: "success", message: "Prompt updated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.get("/bot/get-prompt", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user as SessionData;
    const dbUser = await database.getUserByEmail(user.email);
    if (!dbUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const prompt = dbUser.prompt;
    if (!prompt) {
      return res.status(404).json({ error: "Prompt not set" });
    }

    res.json({ prompt });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete(
  "/bot/delete-prompt",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const user = req.user as DatabaseUser;
      const dbUser = await database.getUserByEmail(user.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }

      await database.updatePrompt(user.email, null);
      res.json({ status: "success", message: "Prompt deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.get("/messages", async (req: Request, res: Response) => {
  res.json({ messages: {} });
});

// Initialize application
initializeApp();

export { server, io };
export default app;
