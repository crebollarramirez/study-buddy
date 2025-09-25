import { Server as SocketIOServer, Socket } from "socket.io";
import OpenAI from "openai";
import { Database, DatabaseUser } from "../database";

interface CustomSocket extends Socket {
  request: any;
  user?: DatabaseUser; // Add user property for authenticated user
}

// Socket-specific authentication function
async function authenticateSocket(
  socket: CustomSocket,
  database: Database
): Promise<DatabaseUser | null> {
  console.log("Socket connection attempt");
  const session = socket.request.session;

  console.log("Session data:", session);
  console.log("Session passport user:", session?.passport?.user);

  // Check if user is authenticated via Passport
  const userEmail = session?.passport?.user;

  if (!userEmail) {
    console.log("Unauthenticated connection attempt");
    socket.emit("auth_error", {
      message: "Not authenticated - please log in first",
    });
    socket.disconnect();
    return null;
  }

  // Get full user data from database using Passport's stored user ID
  try {
    const user = await database.getUserByEmail(userEmail);
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
  } catch (error) {
    console.error("Error fetching user data:", error);
    socket.emit("auth_error", {
      message: "Authentication error - please try again",
    });
    socket.disconnect();
    return null;
  }
}

// Helper function to send welcome message based on user role
async function sendWelcomeMessage(
  socket: CustomSocket,
  database: Database
): Promise<void> {
  try {
    const prompt = await database.getTeacherPrompt();
    const user = socket.user as any;

    if (user.role === "student") {
      if (prompt) {
        socket.emit("response", {
          message: `Welcome, ${user.fullName}! Your teacher has set the prompt to be: ${prompt}`,
        });
      } else {
        socket.emit("response", {
          message: `Welcome, ${user.fullName}! No prompt has been set by your teacher yet.`,
        });
      }
    } else if (user.role === "teacher") {
      socket.emit("response", {
        message: `Welcome, ${user.fullName}! You are connected as a teacher.`,
      });
    }
  } catch (error) {
    console.error("Error fetching teacher prompt:", error);
  }
}

export function initializeSocketHandlers(
  io: SocketIOServer,
  database: Database,
  openai: OpenAI
) {
  io.on("connection", async (socket: CustomSocket) => {
    // Authenticate the socket connection
    const user = await authenticateSocket(socket, database);
    if (!user) {
      // Authentication failed, socket already disconnected
      return;
    }

    // Attach user to socket for easy access
    socket.user = user;
    console.log(`Client connected: ${user.email} (${user.role})`);

    // Send personalized welcome message
    await sendWelcomeMessage(socket, database);

    // Handle client disconnect
    socket.on("disconnect", () => {
      const user = socket.user;
      console.log(
        `Client disconnected: ${user?.email || "unknown"} (${
          user?.role || "unknown"
        })`
      );
    });

    // Handle room joining
    socket.on("join", (data) => {
      const room = data.room;
      const user = socket.user;

      socket.join(room);
      socket.to(room).emit("status", {
        msg: `${user?.fullName || "A user"} (${ 
          user?.role || "unknown"
        }) has joined the room.`,
      });
      console.log(`${user?.email} joined room: ${room}`);
    });

    // Handle room leaving
    socket.on("leave", (data) => {
      const room = data.room;
      const user = socket.user;

      socket.leave(room);
      socket.to(room).emit("status", {
        msg: `${user?.fullName || "A user"} (${ 
          user?.role || "unknown"
        }) has left the room.`,
      });
      console.log(`${user?.email} left room: ${room}`);
    });

    // Handle chat messages
    socket.on("message", async (data) => {
      // Check if user is authenticated and has student role

      const user = socket.user as any;
      const email = user.email;

      try {
        const prompt = await database.getTeacherPrompt();

        if (!prompt) {
          console.log("No prompt set by teacher");
          socket.emit("response", {
            message: "Your teacher hasn't set a prompt yet.",
          });
          return;
        }

        const parsedData = JSON.parse(data);
        const userMessage = parsedData.message || "";

        console.log(`Message from user (${user.role}): ${userMessage}`);
        socket.emit("status", { message: "Assistant is thinking..." });

        // Call OpenAI API for AI response
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are a mentor that only asks questions to students that will help poke holes in their knowledge so they know what to learn more of in the future. You primarily respond back to student answers with additional questions that allow them to think more deeply. An example conversation might go:  Student: "A rabbit is a four-legged animal" Mentor: "What else do you know about rabbits?" Student: "I know that they are small and furry and are fast and they eat carrots." Mentor: "Would it make sense for a rabbit to eat a sandwich?" Student: "No, humans eat sandwiches -- not rabbits." Mentor: "What else do rabbits typically eat?" Make sure to encourage students to either ask their teacher and to look answers up if they do not know the answer. If the conversation deviates significantly from the original topic, guide the conversation back to the original topic. Additionally, with each response you return, grade a student's response with "points", which can be a minimum value of 0 and a maximum value of 20. Example: {"response": "Hello", "points": 10} The number of points a student should receive for a message should be based off of how relevant it is to the subject matter, whether the student response addresses the question that you previously gave them, and how unique or creative the student response is. Format your responses as JSON with two keys: "response" and "points". The value of "response" should be your insightful question as a mentor as a string. The value of "points" should be the number of points you gave the student's response. Do not stop formatting your response as JSON. Your response should always be JSON format with two keys "response" and "points". There should never be an empty value associated with these keys. Please be kind to your students. Do not curse. Do not break character, please. Thank you. The topic that students will be learning is: ${prompt}`,
            },
            { role: "user", content: userMessage },
          ],
          max_tokens: 500,
        });

        const assistantResponse = JSON.parse(
          response.choices[0]?.message?.content ||
            '{"response": "Error processing response", "points": 0}'
        );
        console.log("AI Response:", assistantResponse);

        // Update user's brain points
        const points = Number.parseInt(assistantResponse.points, 10);
        const increment = Number.isNaN(points) ? 0 : points;
        await database.incrementBrainPoints(email, increment);

        // Send response back to the user
        socket.emit("response", {
          message: assistantResponse.response,
          from: "assistant",
        });
      } catch (error) {
        console.error(`Error processing message: ${error}`);
        socket.emit("error", { msg: "Error processing your request" });
      }
    });
  });
}
