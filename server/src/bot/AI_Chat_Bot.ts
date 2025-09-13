import { Pool } from "pg";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

type Role = "system" | "user" | "assistant";
type ChatMsg = { role: Role; content: string };

/**
 * Represents an AI chatbot instance for a specific conversation.
 *
 * This class manages the conversation context, interacts with a PostgreSQL database to store and retrieve messages,
 * and uses OpenAI's API to generate responses. It ensures that responses are unique within a conversation and
 * maintains a sliding window of the last 15 messages for context.
 */
export class AI_Chat_Bot {
  /**
   * Stores the last 15 messages in the conversation for context.
   */
  private window: ChatMsg[] = []; // last 15

  /**
   * Ensures serialized processing of user messages to avoid overlapping calls.
   */
  private busy: Promise<any> = Promise.resolve();

  /**
   * Maximum number of messages to retain in the sliding window.
   */
  private readonly MAX_MESSAGES = 15;

  /**
   * Initializes a new instance of the AI_Chat_Bot class.
   *
   * @param conversationId - The unique ID of the conversation.
   * @param studentId - The MongoDB ObjectId of the student.
   * @param teacherId - The MongoDB ObjectId of the teacher.
   * @param topic - The topic of the conversation, used to customize the system prompt.
   * @param pg - A PostgreSQL connection pool for database operations.
   * @param openai - An OpenAI client for generating responses (default: initialized with API key).
   */
  constructor(
    private readonly conversationId: string,
    private readonly studentId: string,
    private readonly teacherId: string,
    private readonly topic: string,
    private readonly pg: Pool,
    private readonly openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  ) {}

  /**
   * Initializes the bot by loading the last 15 messages and the system prompt into memory.
   * Also ensures the conversation topic is stored/updated in the database.
   *
   * @returns A promise that resolves when initialization is complete.
   */
  async init(): Promise<void> {
    // Ensure the conversation topic is stored/updated in the database
    await this.pg.query(
      `INSERT INTO conversations (id, student_id, teacher_id, topic, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET 
         student_id = EXCLUDED.student_id,
         teacher_id = EXCLUDED.teacher_id,
         topic = EXCLUDED.topic,
         updated_at = NOW()`,
      [this.conversationId, this.studentId, this.teacherId, this.topic]
    );

    // Load most recent 15 messages into memory (chronological)
    const { rows } = await this.pg.query<{
      role: Role;
      content: string;
    }>(
      `
      SELECT role, content
        FROM messages
       WHERE conversation_id = $1
       ORDER BY created_at DESC
       LIMIT ${this.MAX_MESSAGES}
    `,
      [this.conversationId]
    );

    this.window = rows.reverse();

    // Load system prompt from file and add it to the beginning of the window
    const systemPromptPath = path.resolve(
      __dirname,
      "../bot/prompts/system_prompt.txt"
    );
    const systemPrompt = fs
      .readFileSync(systemPromptPath, "utf-8")
      .replace("{TOPIC}", this.topic);

    console.log("System prompt:", systemPrompt);
    this.window.unshift({ role: "system", content: systemPrompt });
  }

  /**
   * Handles a user message by serializing the processing of turns.
   *
   * @param userText - The user's message.
   * @returns A promise that resolves to the bot's response.
   */
  async onUserMessage(userText: string): Promise<string> {
    this.busy = this.busy
      .then(() => this._handleTurn(userText))
      .catch(() => {});
    return this.busy;
  }

  /**
   * Processes a user message, generates a response, and ensures uniqueness of the response.
   *
   * @param userText - The user's message.
   * @returns A promise that resolves to the bot's response.
   */
  private async _handleTurn(userText: string): Promise<string> {
    // 1) persist user, update window
    await this.pg.query(
      `INSERT INTO messages (conversation_id, role, content)
       VALUES ($1, 'user', $2)`,
      [this.conversationId, userText]
    );
    this.pushWindow({ role: "user", content: userText });

    const prompt: ChatMsg[] = [
      ...this.window,
      { role: "user", content: userText },
    ];

    // 3) call OpenAI
    const completion = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 120,
      messages: prompt.map((m) => ({ role: m.role, content: m.content })),
    });

    let out =
      completion.choices[0]?.message?.content?.trim() ?? "Can you elaborate?";

    // 4) store assistant with uniqueness guard; retry once if duplicate
    await this.tryStoreAssistant(out);
    return out;
  }

  /**
   * Attempts to store the assistant's response in the database, ensuring uniqueness.
   *
   * @param content - The assistant's response content.
   * @param force - Whether to force the insertion, bypassing uniqueness checks.
   * @returns A promise that resolves to true if the response was stored successfully, false otherwise.
   */
  private async tryStoreAssistant(content: string): Promise<boolean> {
    try {
      await this.pg.query(
        `INSERT INTO messages (conversation_id, role, content, question_hash)
         VALUES ($1, 'assistant', $2, $3)
         ON CONFLICT (conversation_id, question_hash) DO NOTHING`,
        [this.conversationId, content, ""]
      );

      this.pushWindow({ role: "assistant", content });
      return true;
    } catch (e) {
      console.error("Error storing assistant message:", e);
      return false;
    }
  }

  /**
   * Maintains a sliding window of the last 15 messages for context.
   *
   * @param m - The message to add to the window.
   */
  private pushWindow(m: ChatMsg) {
    this.window.push(m);
    if (this.window.length > 15) this.window.shift();
  }

}
