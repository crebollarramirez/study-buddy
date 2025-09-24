import { Server as SocketIOServer, Socket } from "socket.io";
import OpenAI from "openai";
import { PostgresDatabase } from "../database/PostgresDatabase";

interface CustomSocket extends Socket {
  request: any;
}

export function initializeSocketHandlers(
  io: SocketIOServer,
  database: PostgresDatabase,
  openai: OpenAI
) {
  io.on("connection", async (socket: CustomSocket) => {
    console.log("Socket connection attempt");
    const session = socket.request.session;

    console.log("Session data:", session);
    console.log("Session email:", session?.email);

    // Temporarily disabled for testing - uncomment after authentication is working
    if (!session?.email) {
      console.log("Unauthenticated connection attempt - allowing for testing");
      socket.emit("auth_error", {
        message: "Not authenticated - please log in first",
      });
      socket.disconnect();
      return;
    }

    console.log(`Client connected: ${session?.email || "anonymous"}`);

    // Send welcome message with teacher's prompt
    try {
      const prompt = await database.getTeacherPrompt();

      if (prompt) {
        socket.emit("response", {
          message: "Welcome! Your teacher has set the prompt to be: " + prompt,
        });
      } else {
        socket.emit("response", {
          message: "Welcome! No prompt has been set by your teacher yet.",
        });
      }
    } catch (error) {
      console.error("Error fetching teacher prompt:", error);
    }

    // Handle client disconnect
    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });

    // Handle room joining
    socket.on("join", (data) => {
      const room = data.room;
      socket.join(room);
      socket.to(room).emit("status", { msg: "A user has joined the room." });
    });

    // Handle room leaving
    socket.on("leave", (data) => {
      const room = data.room;
      socket.leave(room);
      socket.to(room).emit("status", { msg: "A user has left the room." });
    });

    // Handle chat messages
    socket.on("message", async (data) => {
      const email = session?.email || "anonymous";

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

        // Student messages are intentionally not persisted while we complete the PostgreSQL migration.

        console.log(`Message from user: ${userMessage}`);
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

        // Save bot message to database (only if authenticated)
        if (session?.email) {
          const incrementValue = Number.parseInt(assistantResponse.points, 10);
          if (!Number.isNaN(incrementValue)) {
            await database.incrementBrainPoints(email, incrementValue);
          }
        }

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
