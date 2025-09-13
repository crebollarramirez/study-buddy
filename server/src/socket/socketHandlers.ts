// src/ws/initializeSocketHandlers.ts
import { Server as SocketIOServer, Socket } from "socket.io";
import { Collection } from "mongodb";
import OpenAI from "openai";
import { Pool } from "pg";
import { AI_Chat_Bot } from "../bot/AI_Chat_Bot"; 

interface CustomSocket extends Socket {
  request: any;
  user?: any; // authenticated user document
  conversationId?: string | undefined;
  bot?: AI_Chat_Bot | undefined;
}

/**
 * Authenticates a socket connection by verifying the user's session and retrieving
 * the corresponding user data from the database. If authentication fails, the socket
 * connection is terminated with an appropriate error message.
 *
 * @param socket - The custom socket instance representing the client's connection.
 * @param users - The MongoDB collection containing user data.
 * 
 * @returns A promise that resolves to the authenticated user object if successful,
 * or `null` if authentication fails.
 *
 * @throws Emits an "auth_error" event to the socket with a descriptive error message
 * and disconnects the socket in case of authentication failure or database errors.
 *
 * @remarks
 * - The function expects the session data to be available on `socket.request.session`.
 * - The session must include a `passport.user` field containing the user's email.
 * - If the user is not found in the database or the session is invalid, the connection
 *   is terminated.
 */
async function authenticateSocket(socket: CustomSocket, users: Collection) {
  console.log("Socket connection attempt");
  const session = socket.request.session;
  console.log("Session data:", session);
  console.log("Session passport user:", session?.passport?.user);

  const userEmail = session?.passport?.user;
  if (!userEmail) {
    console.log("Unauthenticated connection attempt");
    socket.emit("auth_error", {
      message: "Not authenticated - please log in first",
    });
    socket.disconnect();
    return null;
  }

  try {
    const user = await users.findOne({ email: userEmail });
    if (!user) {
      console.log("User not found in database:", userEmail);
      socket.emit("auth_error", {
        message: "User not found - please log in again",
      });
      socket.disconnect();
      return null;
    }
    console.log(`Client authenticated: ${user.email} (${user.role})`);
    return user;
  } catch (err) {
    console.error("Error fetching user data:", err);
    socket.emit("auth_error", {
      message: "Authentication error - please try again",
    });
    socket.disconnect();
    return null;
  }
}

/**
 * Sends a welcome message to the connected user based on their role.
 * 
 * This function retrieves the teacher's data from the provided `users` collection
 * to determine the class topic. Depending on the role of the connected user
 * (either "student" or "teacher"), it emits an appropriate welcome message
 * through the provided socket connection.
 * 
 * @param socket - The socket instance representing the connected user. 
 *                 It includes user information such as their role and name.
 * @param users - A collection interface used to query user data, specifically
 *                to fetch the teacher's information.
 * 
 * @throws Will log an error to the console if there is an issue fetching the teacher's data.
 */
async function sendWelcomeMessage(socket: CustomSocket, users: Collection) {
  try {
    const teacher = await users.findOne(
      { role: "teacher" },
    );

    console.log("Fetched teacher data for welcome message:", teacher);
    const topic = teacher?.prompt;
    const user = socket.user;

    if (user.role === "student") {
      if (topic) {
        socket.emit("response", {
          message: `Welcome, ${user.name}! Your class topic is: ${topic}`,
        });
      } else {
        socket.emit("response", {
          message: `Welcome, ${user.name}! Your teacher hasn't set a topic yet.`,
        });
      }
    } else if (user.role === "teacher") {
      socket.emit("response", {
        message: `Welcome, ${user.name}! You are connected as a teacher.`,
      });
    }
  } catch (error) {
    console.error("Error fetching teacher topic:", error);
  }
}

/**
 * Ensures that a conversation exists for a given student and teacher on a specific topic.
 * If a `conversationId` is provided, it validates that the conversation exists and belongs to the student.
 * If no `conversationId` is provided, it checks for an existing conversation for the student.
 * If no existing conversation is found, a new one is created.
 *
 * @param pg - The PostgreSQL connection pool used for database queries.
 * @param studentId - The ID of the student involved in the conversation.
 * @param teacherId - The ID of the teacher involved in the conversation.
 * @param topic - The topic of the conversation.
 * @param conversationId - (Optional) The ID of an existing conversation to validate.
 * @returns A promise that resolves to the ID of the existing or newly created conversation.
 * @throws An error if the provided `conversationId` is invalid or if a new conversation cannot be created.
 */
async function ensureConversation(
  pg: Pool,
  studentId: string,
  teacherId: string,
  topic: string,
  conversationId?: string
): Promise<string> {
  if (conversationId) {
    // Validate it exists and belongs to the student
    const check = await pg.query<{ id: string }>(
      `SELECT id FROM conversations WHERE student_id = $1 LIMIT 1`,
      [conversationId]
    );
    if (check.rowCount === 1) return conversationId;
    throw new Error("Conversation not found or not owned by current student");
  }

  // Use studentId as the conversationId for consistent room joining
  // Check if a conversation already exists for this student
  const existing = await pg.query<{ id: string }>(
    `SELECT id FROM conversations WHERE student_id = $1 LIMIT 1`,
    [studentId]
  );

  if (existing.rowCount === 0) {
    // Create new conversation using gen_random_uuid() for id but studentId for student_id
    const { rows } = await pg.query<{ id: string }>(
      `INSERT INTO conversations (student_id, teacher_id, topic)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [studentId, teacherId, topic]
    );
    if (!rows.length || !rows[0])
      throw new Error("Failed to create conversation");
    return rows[0].id;
  }

  // Return the existing conversation id
  if (!existing.rows[0]) throw new Error("Conversation lookup failed");
  return existing.rows[0].id;
}

export function initializeSocketHandlers(
  io: SocketIOServer,
  users: Collection,
  pg: Pool,
  openai: OpenAI
) {
  io.on("connection", async (socket: CustomSocket) => {
    // 1) Authenticate
    const user = await authenticateSocket(socket, users);
    if (!user) return; // disconnected already
    socket.user = user;
    console.log(`Client connected: ${user.email} (${user.role})`);

    // 2) Welcome
    await sendWelcomeMessage(socket, users);
    console.log("Welcome message sent");

    // 3) Auto-join conversation (creates AI_Chat_Bot per socket automatically)
    try {
      const studentId = String(socket.user._id);
      const teacherDoc = await users.findOne(
        { role: "teacher" },
      );
      if (!teacherDoc) throw new Error("Teacher not found");
      const teacherId = String(teacherDoc._id);

      const topic = String(teacherDoc.prompt ?? "");
      console.log("Auto-joining conversation for user:", socket.user.email);

      // Create new conversation (no existing conversationId)
      const conversationId = await ensureConversation(
        pg,
        studentId,
        teacherId,
        topic
      );

      // Create a bot instance bound to this socket's conversation
      const bot = new AI_Chat_Bot(conversationId, studentId, teacherId, topic, pg, openai);
      await bot.init();

      socket.conversationId = conversationId;
      socket.bot = bot;

      socket.join(conversationId);
      socket.emit("joined", { conversationId, topic });
      console.log(
        `${socket.user?.email} auto-joined conversation: ${conversationId}`
      );
    } catch (err: any) {
      console.error("Auto-join error:", err);
      socket.emit("error", {
        code: "AUTO_JOIN_FAIL",
        message: err?.message ?? "Failed to join conversation",
      });
    }

    // 4) Manual join conversation (optional - kept for backward compatibility)
    // socket.on("join", async (data: any) => {
    //   try {
    //     const rawConvId = data?.conversationId || data?.room; // backward-compat: accept "room"
    //     const studentId = String(socket.user._id);
    //     const teacherDoc = await users.findOne(
    //       { role: "teacher" },
    //       { projection: { _id: 1, topic: 1 } }
    //     );
    //     if (!teacherDoc) throw new Error("Teacher not found");
    //     const teacherId = String(teacherDoc._id);


    //     console.log("This is teacher id, ", teacherId)
    //     const topic = String(teacherDoc.topic ?? "");

    //     console.log("this is the join data:", data);

    //     // Ensure conversation id
    //     const conversationId = await ensureConversation(
    //       pg,
    //       studentId,
    //       teacherId,
    //       topic,
    //       rawConvId
    //     );

    //     // If this socket already had a bot, clean it up before switching rooms
    //     if (socket.bot) {
    //       try {
    //         socket.bot.dispose();
    //       } catch {}
    //       socket.leave(socket.conversationId as string);
    //     }

    //     // Create a bot instance bound to this socket's conversation
    //     const bot = new AI_Chat_Bot(conversationId, topic, pg, openai);
    //     await bot.init();

    //     socket.conversationId = conversationId;
    //     socket.bot = bot;

    //     socket.join(conversationId);
    //     socket.to(conversationId).emit("status", {
    //       msg: `${socket.user?.name || "A user"} (${
    //         socket.user?.role || "unknown"
    //       }) has joined the conversation.`,
    //     });

    //     socket.emit("joined", { conversationId, topic });
    //     console.log(
    //       `${socket.user?.email} joined conversation: ${conversationId}`
    //     );
    //   } catch (err: any) {
    //     console.error("Join error:", err);
    //     socket.emit("error", {
    //       code: "JOIN_FAIL",
    //       message: err?.message ?? "Join failed",
    //     });
    //   }
    // });

    // 5) Leave conversation
    socket.on("leave", (data: any) => {
      try {
        const conv =
          data?.conversationId || data?.room || socket.conversationId;
        if (!conv) return;
        socket.leave(conv);
        socket.to(conv).emit("status", {
          msg: `${socket.user?.name || "A user"} (${
            socket.user?.role || "unknown"
          }) has left the conversation.`,
        });
        console.log(`${socket.user?.email} left conversation: ${conv}`);

        if (socket.bot) {
          try {
            delete socket.bot;
          } catch {}
          socket.bot = undefined;
        }
        socket.conversationId = undefined;
      } catch (err) {
        console.error("Leave error:", err);
      }
    });

    // 6) User message -> bot turn
    socket.on("message", async (data: any) => {
      const userDoc = socket.user;
      if (!userDoc) {
        socket.emit("auth_error", { message: "Not authenticated" });
        return;
      }
      if (!socket.bot || !socket.conversationId) {
        socket.emit("error", {
          code: "ROOM",
          message: "Join a conversation first",
        });
        return;
      }

      console.log("message", data);
      try {
        let userMessage: string;
        if (typeof data === "string") {
          try {
            const parsed = JSON.parse(data);
            userMessage = parsed?.message ?? data;
          } catch {
            userMessage = data;
          }
        } else {
          userMessage = data?.message ?? "";
        }
        if (!userMessage || typeof userMessage !== "string") {
          socket.emit("error", { code: "BAD_INPUT", message: "Empty message" });
          return;
        }

        socket.emit("status", { message: "Assistant is thinking..." });

        // The bot manages Postgres memory + no-repeat and returns ONE question
        const question = await socket.bot.onUserMessage(userMessage);

        // Emit to this client (and optionally the room)
        socket.emit("response", { message: question, from: "assistant" });
        // io.to(socket.conversationId).emit("response", { message: question, from: "assistant" });
      } catch (error) {
        console.error("Error processing message:", error);
        socket.emit("error", {
          code: "TURN_FAIL",
          message: "Error processing your request",
        });
      }
    });

    // 7) Disconnect cleanup
    socket.on("disconnect", () => {
      const u = socket.user;
      console.log(
        `Client disconnected: ${u?.email || "unknown"} (${
          u?.role || "unknown"
        })`
      );
      if (socket.bot) {
        try {
          delete socket.bot;
        } catch {}
      }
    });
  });
}