import express, { Request, Response } from "express";
import cors from "cors";
import session from "express-session";
import { Server } from "socket.io";
import { createServer } from "http";
import dotenv from "dotenv";
import OpenAI from "openai";
import passport from "passport";
import { configurePassport } from "./config/passport";
import { initializeSocketHandlers } from "./socket/socketHandlers";
import "./types/session";
import { PostgresDatabase } from "./database/PostgresDatabase";

// Load environment variables from .env file
dotenv.config();

// Debug section to verify environment variables
console.log("=== Environment Variables Debug ===");
console.log(
  "GOOGLE_CLIENT_ID:",
  process.env.GOOGLE_CLIENT_ID ? "✓ Loaded" : "✗ Missing"
);
console.log(
  "GOOGLE_CLIENT_SECRET:",
  process.env.GOOGLE_CLIENT_SECRET ? "✓ Loaded" : "✗ Missing"
);
console.log("POSTGRES_URL:", process.env.POSTGRES_URL ? "✓ Loaded" : "✗ Missing");
console.log("CLIENT:", process.env.CLIENT);
console.log("SECRET_KEY:", process.env.SECRET_KEY ? "✓ Loaded" : "✗ Missing");
console.log(
  "OPENAI_API_KEY:",
  process.env.OPENAI_API_KEY ? "✓ Loaded" : "✗ Missing"
);
console.log("=== End Debug ===");

const app = express();
const server = createServer(app);

// PostgreSQL setup
const POSTGRES_URL = process.env.POSTGRES_URL || "";

if (!POSTGRES_URL) {
  console.error("POSTGRES_URL environment variable is not configured.");
  process.exit(1);
}

const database = new PostgresDatabase(POSTGRES_URL);

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
const sessionStore = new session.MemoryStore();

const sessionMiddleware = session({
  secret: process.env.SECRET_KEY || "TEST",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    httpOnly: true,
    secure: false, // Set to true in production with HTTPS
    sameSite: "lax",
  },
  store: sessionStore,
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

// Custom middleware for login requirement
const loginRequired = (req: Request, res: Response, next: any) => {
  if (!req.session.email) {
    return res.redirect(process.env.CLIENT + "/login");
  }
  next();
};

// Initialize PostgreSQL connection
async function initializeDatabase() {
  try {
    await database.initialize();

    // Configure Passport after database connection
    configurePassport(database);

    // Initialize Socket.IO handlers with database collections
    initializeSocketHandlers(io, database, openai);

    console.log("Connected to PostgreSQL");
  } catch (error) {
    console.error("Failed to connect to PostgreSQL:", error);
    process.exit(1);
  }
}

// Routes
app.get("/", loginRequired, (req: Request, res: Response) => {
  console.log("You were authorized");
  res.send("Welcome to the StudyBuddy API!");
});

// Note: OAuth routes with passport.js
app.get("/register", (req: Request, res: Response) => {
  const role = ((req.query.role as string) || "student").toLowerCase();
  req.session.role = role;
  req.session.authAction = "register";
  res.redirect("/auth/google");
});

app.get("/login", (req: Request, res: Response) => {
  req.session.authAction = "login";
  res.redirect("/auth/google");
});

// Google OAuth routes
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  async (req: Request, res: Response) => {
    const user = req.user as any;
    const authAction = req.session.authAction || "login";

    console.log("THIS IS THE AUTH ACTION: ", authAction);

    if (authAction === "register") {
      const role = (req.session.role || "student").toLowerCase();

      if (user.isNewUser) {
        try {
          const firstName = user.firstName || user.name?.split(" ")?.[0] || "";
          const lastName =
            user.lastName || user.name?.split(" ")?.slice(1).join(" ") || "";

          await database.createUser({
            firstname: firstName,
            lastname: lastName,
            google_email: user.email,
            role,
            brain_points: 0,
            prompt: null,
          });

          console.log(`New user registered: ${user.email} as ${role}`);
          return res.redirect("http://localhost:3001/login");
        } catch (error) {
          console.error("Error creating user:", error);
          return res.status(500).send("Error creating user");
        }
      } else {
        return res.status(404).send("User already registered");
      }
    }

    // Login flow
    console.log("You are logged in as... ", user.email);

    const existingUser = await database.findUserByEmail(user.email);
    if (!existingUser) {
      return res.status(404).send("User not found");
    }

    // Store user info in session
    req.session.email = existingUser.google_email;
    req.session.name = `${existingUser.firstname} ${existingUser.lastname}`.trim();
    req.session.role = existingUser.role;

    console.log("Session saved:", req.session);
    res.redirect("http://localhost:3001/");
  }
);

app.get("/logout", (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Session destruction error:", err);
    }
    res.redirect("http://localhost:3001/");
  });
});

app.get("/brain_points", loginRequired, async (req: Request, res: Response) => {
  try {
    const email = req.session.email;
    if (!email) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const user = await database.findUserByEmail(email);
    if (user) {
      res.json({ brain_points: user.brain_points });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/students", async (req: Request, res: Response) => {
  try {
    const studentList = await database.listStudents();
    res.json({
      students: studentList.map((student) => ({
        email: student.google_email,
        name: `${student.firstname} ${student.lastname}`.trim(),
        brain_points: student.brain_points,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/account-type", (req: Request, res: Response) => {
  const email = req.session.email;
  if (!email) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  database.findUserByEmail(email).then((user) => {
    if (user) {
      res.json({ account_type: user.role });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  });
});

app.post("/bot/set-prompt", async (req: Request, res: Response) => {
  const { prompt } = req.body;
  const email = req.session.email;

  if (!email) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const user = await database.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await database.updateUserPrompt(email, prompt);
    res.json({ status: "success", message: "Prompt updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/bot/get-prompt", async (req: Request, res: Response) => {
  const email = req.session.email;

  if (!email) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  try {
    const user = await database.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const prompt = user.prompt;
    if (!prompt) {
      return res.status(404).json({ error: "Prompt not set" });
    }

    res.json({ prompt });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/bot/delete-prompt", async (req: Request, res: Response) => {
  const email = req.session.email;

  if (!email) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  try {
    const user = await database.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await database.updateUserPrompt(email, null);
    res.json({ status: "success", message: "Prompt deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/messages", async (req: Request, res: Response) => {
  try {
    res.json({ messages: {} });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Initialize database and export app
initializeDatabase();

export { server, io };
export default app;
