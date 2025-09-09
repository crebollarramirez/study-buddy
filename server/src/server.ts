import express, { Request, Response } from "express";
import cors from "cors";
import session from "express-session";
import MongoStore from "connect-mongo";
import { MongoClient, Db, Collection } from "mongodb";
import { Server } from "socket.io";
import { createServer } from "http";
import dotenv from "dotenv";
import OpenAI from "openai";
import passport from "passport";
import { configurePassport, requireAuth, requireRole } from "./config/passport";
import { initializeSocketHandlers } from "./socket/socketHandlers";
import createAuthRouter from "./routes/auth";
import "./types/session";

// Load environment variables from .env file
dotenv.config();
const app = express();
const server = createServer(app);

// MongoDB setup
const MONGO_URL = process.env.MONGO_URL || "";
const mongoClient = new MongoClient(MONGO_URL);
let db: Db;
let users: Collection;
let messages: Collection;

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
  store: MongoStore.create({
    mongoUrl: MONGO_URL,
  }),
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

// Initialize MongoDB connection
async function initializeDatabase() {
  try {
    await mongoClient.connect();
    db = mongoClient.db("StudyBuddy");
    users = db.collection("users");
    messages = db.collection("messages");

    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}

// Initialize application components that depend on database
async function initializeApp() {
  try {
    // First, initialize the database
    await initializeDatabase();

    // Configure Passport after database connection
    configurePassport(users);

    // Initialize auth routes with users collection
    authRouter.initializeAuthRoutes(users);

    // Mount auth routes with /auth prefix
    app.use("/auth", authRouter.router);

    // Initialize Socket.IO handlers with database collections
    initializeSocketHandlers(io, users, messages, openai);

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
    const user = req.user as any;
    const dbUser = await users.findOne({ email: user.email });
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
    const studentList = await users
      .find({ role: "student" })
      .project({ email: 1, name: 1, brain_points: 1 })
      .toArray();
    res.json({ students: studentList });
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
      const user = req.user as any;
      res.json({
        message: "Welcome to teacher dashboard",
        teacher: user.name,
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
    const user = req.user as any;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    try {
      const dbUser = await users.findOne({ email: user.email });
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }

      await users.updateOne({ email: user.email }, { $set: { prompt } });
      res.json({ status: "success", message: "Prompt updated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.get("/bot/get-prompt", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const dbUser = await users.findOne({ email: user.email });
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
      const user = req.user as any;
      const dbUser = await users.findOne({ email: user.email });
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }

      await users.updateOne({ email: user.email }, { $set: { prompt: null } });
      res.json({ status: "success", message: "Prompt deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.get("/messages", async (req: Request, res: Response) => {
  try {
    const allMessages = await messages.find({}).toArray();
    const groupedMessages: { [email: string]: any[] } = {};

    allMessages.forEach((message) => {
      const email = message.email;
      const messageData = {
        message: message.message,
        timestamp: message.timestamp,
        prompt: message.prompt,
        sender: message.sender,
      };

      if (groupedMessages[email]) {
        groupedMessages[email].push(messageData);
      } else {
        groupedMessages[email] = [messageData];
      }
    });

    res.json({ messages: groupedMessages });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Initialize application
initializeApp();

export { server, io };
export default app;
