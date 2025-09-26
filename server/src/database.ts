type QueryResult<T> = { rows: T[] };

interface Queryable {
  query<T>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;
  end?: () => Promise<void>;
}

interface UserRow {
  id?: number;
  firstname: string;
  lastname: string;
  google_email: string;
  role: string;
  brain_points: number;
  prompt: string | null;
  google_id: string | null;
  created_at: Date;
}

export interface DatabaseUser {
  email: string;
  fullName: string;
  role: string;
  brain_points: number;
  prompt: string | null;
  googleId: string | null;
  createdAt: Date;
}

export interface CreateUserInput {
  email: string;
  fullName: string;
  role: string;
  googleId: string;
  prompt?: string | null;
}

const CREATE_USERS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    firstname TEXT NOT NULL,
    lastname TEXT NOT NULL,
    google_email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL,
    brain_points INTEGER NOT NULL DEFAULT 0,
    prompt TEXT,
    google_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`;

const SELECT_USER_BY_EMAIL_SQL = `
  SELECT id, firstname, lastname, google_email, role, brain_points, prompt, google_id, created_at
  FROM users
  WHERE google_email = $1
  LIMIT 1;
`;

const INSERT_USER_SQL = `
  INSERT INTO users (firstname, lastname, google_email, role, brain_points, prompt, google_id)
  VALUES ($1, $2, $3, $4, $5, $6, $7)
  ON CONFLICT (google_email) DO NOTHING;
`;

const UPDATE_PROMPT_SQL = `
  UPDATE users
  SET prompt = $2
  WHERE google_email = $1;
`;

const INCREMENT_BRAIN_POINTS_SQL = `
  UPDATE users
  SET brain_points = brain_points + $2
  WHERE google_email = $1
  RETURNING brain_points;
`;

const SELECT_STUDENTS_SQL = `
  SELECT firstname, lastname, google_email, role, brain_points, prompt, google_id, created_at
  FROM users
  WHERE role = 'student'
  ORDER BY lastname ASC, firstname ASC;
`;

const SELECT_TEACHER_PROMPT_SQL = `
  SELECT prompt
  FROM users
  WHERE role = 'teacher'
  ORDER BY created_at ASC
  LIMIT 1;
`;

/**
 * @class InMemoryQueryRunner
 * @description
 * Lightweight query runner used as a fallback when PostgreSQL is unavailable.
 *
 * - Stores user rows in a process-local `Map` keyed by email.
 * - Emulates the subset of SQL statements required by the application.
 * - Enables tests to exercise database logic without external services.
 */
class InMemoryQueryRunner implements Queryable {
  private users = new Map<string, UserRow>();

  /**
   * @async
   * @function query
   * @description
   * Executes a simulated SQL statement against the in-memory data set.
   *
   * - Supports CREATE TABLE, SELECT, INSERT, and UPDATE verbs used in production.
   * - Interprets SQL patterns to route behavior to dedicated handlers.
   * - Preserves compatibility with the `pg` driver's return signature.
   *
   * @param {string} sql - Raw SQL string issued by the database abstraction.
   * @param {unknown[]} [params=[]] - Parameter array mirroring prepared statements.
   *
   * @throws {Error} If the query text is not recognized by the emulator.
   *
   * @returns {Promise<QueryResult<T>>} Resolves with rows matching the query shape.
   */
  async query<T>(sql: string, params: unknown[] = []): Promise<QueryResult<T>> {
    const normalized = sql.replace(/\s+/g, " ").trim().toLowerCase();

    if (normalized.startsWith("create table")) {
      // Table creation is a no-op for in-memory implementation.
      return { rows: [] as T[] };
    }

    if (
      normalized.startsWith("select") &&
      normalized.includes("where google_email = $1")
    ) {
      const email = params[0] as string;
      const user = this.users.get(email);
      return { rows: (user ? [user] : []) as unknown as T[] };
    }

    if (normalized.startsWith("insert into users")) {
      const [firstname, lastname, email, role, brainPoints, prompt, googleId] =
        params as [
          string,
          string,
          string,
          string,
          number,
          string | null,
          string | null
        ];

      if (!this.users.has(email)) {
        this.users.set(email, {
          firstname,
          lastname,
          google_email: email,
          role,
          brain_points: brainPoints,
          prompt: prompt ?? null,
          google_id: googleId ?? null,
          created_at: new Date(),
        });
      }
      return { rows: [] as T[] };
    }

    if (
      normalized.startsWith("update users") &&
      normalized.includes("set prompt")
    ) {
      const [email, prompt] = params as [string, string | null];
      const existing = this.users.get(email);
      if (existing) {
        existing.prompt = prompt ?? null;
      }
      return { rows: [] as T[] };
    }

    if (
      normalized.startsWith("update users") &&
      normalized.includes("brain_points = brain_points + $2")
    ) {
      const [email, increment] = params as [string, number];
      const existing = this.users.get(email);
      if (existing) {
        existing.brain_points += increment;
        return {
          rows: [{ brain_points: existing.brain_points }] as unknown as T[],
        };
      }
      return { rows: [] as T[] };
    }

    if (normalized.startsWith("select firstname")) {
      const rows = Array.from(this.users.values())
        .filter((user) => user.role === "student")
        .sort((a, b) => {
          const lastCompare = a.lastname.localeCompare(b.lastname);
          if (lastCompare !== 0) return lastCompare;
          return a.firstname.localeCompare(b.firstname);
        });
      return { rows: rows as unknown as T[] };
    }

    if (
      normalized.startsWith("select prompt") &&
      normalized.includes("where role = 'teacher'")
    ) {
      const teacher = Array.from(this.users.values())
        .filter((user) => user.role === "teacher")
        .sort((a, b) => a.created_at.getTime() - b.created_at.getTime())[0];
      return {
        rows: (teacher ? [{ prompt: teacher.prompt }] : []) as unknown as T[],
      };
    }

    throw new Error(`Unsupported query in in-memory runner: ${sql}`);
  }
}

/**
 * @class Database
 * @description
 * PostgreSQL-backed persistence layer responsible for user storage.
 *
 * - Provides a uniform query interface with optional in-memory fallback.
 * - Ensures all SQL interactions are encapsulated within a single module.
 * - Supplies higher-level helpers for user-centric operations across the app.
 */
export class Database {
  private queryRunner: Queryable;
  private useInMemory: boolean;

  /**
   * @constructor
   * @description
   * Initializes the database wrapper with the preferred connection strategy.
   *
   * - Attempts to connect to PostgreSQL when a connection string is provided.
   * - Falls back to the in-memory query runner when the `pg` module is unavailable.
   * - Prepares the query runner for subsequent method invocations.
   *
   * @param {string} [connectionString] - PostgreSQL connection URI or undefined for in-memory mode.
   */
  constructor(private connectionString?: string) {
    this.queryRunner = this.createQueryRunner(connectionString);
    this.useInMemory = this.queryRunner instanceof InMemoryQueryRunner;
  }

  /**
   * @function createQueryRunner
   * @description
   * Selects the appropriate query runner implementation based on runtime conditions.
   *
   * - Dynamically requires the `pg` module to avoid hard dependency failures.
   * - Instantiates a `pg.Pool` when PostgreSQL connectivity is available.
   * - Returns an `InMemoryQueryRunner` when configuration or dependencies are missing.
   *
   * @param {string} [connectionString] - Connection string used to configure the PostgreSQL pool.
   *
   * @throws {Error} If instantiating the `pg` pool fails for reasons other than module absence.
   *
   * @returns {Queryable} Concrete query runner ready to execute SQL statements.
   */
  private createQueryRunner(connectionString?: string): Queryable {
    if (connectionString) {
      try {
        // Dynamically require pg to keep compatibility when dependency is unavailable (e.g., tests).
        const pg = require("pg");
        const pool = new pg.Pool({ connectionString });
        console.log("✅ Connected to PostgreSQL database successfully");
        return pool;
      } catch (error) {
        console.error("❌ Failed to connect to PostgreSQL database:", error);
        console.warn("Falling back to in-memory query runner.");
      }
    } else {
      console.warn(
        "⚠️ No connection string provided, using in-memory database"
      );
    }

    return new InMemoryQueryRunner();
  }

  /**
   * @async
   * @function initialize
   * @description
   * Prepares the backing data store for application use.
   *
   * - Creates the `users` table when connected to PostgreSQL.
   * - Performs a no-op when using the in-memory query runner.
   * - Guarantees idempotent setup for repeated initializations.
   *
   * @throws {Error} If the underlying query runner fails to execute the setup statement.
   *
   * @returns {Promise<void>} Resolves when the initialization query completes.
   */
  async initialize(): Promise<void> {
    await this.queryRunner.query(CREATE_USERS_TABLE_SQL);
  }

  /**
   * @async
   * @function close
   * @description
   * Cleans up open resources held by the database abstraction.
   *
   * - Closes the PostgreSQL pool when applicable.
   * - Skips teardown when running against the in-memory query runner.
   * - Helps prevent resource leaks during controlled shutdowns.
   *
   * @throws {Error} If the pool's `end` method rejects during cleanup.
   *
   * @returns {Promise<void>} Resolves once the teardown logic finishes.
   */
  async close(): Promise<void> {
    if (!this.useInMemory && this.queryRunner.end) {
      await this.queryRunner.end();
    }
  }

  /**
   * @async
   * @function getUserByEmail
   * @description
   * Retrieves a single user record using their Google email as the lookup key.
   *
   * - Delegates the SQL query to the configured query runner.
   * - Converts the returned row into the canonical `DatabaseUser` shape.
   * - Supports both PostgreSQL and in-memory data sources transparently.
   *
   * @param {string} email - Google email address identifying the desired user.
   *
   * @throws {Error} If executing the SELECT statement fails.
   *
   * @returns {Promise<DatabaseUser | null>} Resolves with the located user or `null` when absent.
   */
  async getUserByEmail(email: string): Promise<DatabaseUser | null> {
    const result = await this.queryRunner.query<UserRow>(
      SELECT_USER_BY_EMAIL_SQL,
      [email]
    );
    const row = result.rows[0];
    return row ? this.mapRowToUser(row) : null;
  }

  /**
   * @async
   * @function createUser
   * @description
   * Inserts a new user into the persistence layer if they do not already exist.
   *
   * - Splits the provided full name into first and last name components.
   * - Executes an upsert-like INSERT guarded by the email uniqueness constraint.
   * - Initializes role, prompt, and brain point defaults consistently.
   *
   * @param {CreateUserInput} params - Data required to seed the new user record.
   *
   * @throws {Error} If the INSERT statement fails within the query runner.
   *
   * @returns {Promise<void>} Resolves after the insertion attempt completes.
   */
  async createUser({
    email,
    fullName,
    role,
    googleId,
    prompt,
  }: CreateUserInput) {
    const { firstname, lastname } = this.splitName(fullName);
    await this.queryRunner.query(INSERT_USER_SQL, [
      firstname,
      lastname,
      email,
      role,
      0,
      prompt ?? null,
      googleId ?? null,
    ]);
  }

  /**
   * @async
   * @function updatePrompt
   * @description
   * Persists a new mentor prompt for a given user.
   *
   * - Accepts prompt updates from both teachers and administrators.
   * - Handles null prompts to support clearing existing values.
   * - Delegates the update to the configured query runner.
   *
   * @param {string} email - Google email used to identify the target user.
   * @param {string | null} prompt - New prompt content or `null` to unset.
   *
   * @throws {Error} If the UPDATE statement fails during execution.
   *
   * @returns {Promise<void>} Resolves once the prompt field has been updated.
   */
  async updatePrompt(email: string, prompt: string | null): Promise<void> {
    await this.queryRunner.query(UPDATE_PROMPT_SQL, [email, prompt]);
  }

  /**
   * @async
   * @function incrementBrainPoints
   * @description
   * Adjusts a user's brain points by the specified delta.
   *
   * - Uses an atomic UPDATE to increment points within the database.
   * - Returns the resulting balance for immediate feedback to callers.
   * - Maintains compatibility with both PostgreSQL and in-memory stores.
   *
   * @param {string} email - Google email identifying the user to update.
   * @param {number} amount - Number of points to add to the existing total.
   *
   * @throws {Error} If the underlying UPDATE statement fails to execute.
   *
   * @returns {Promise<number | null>} Resolves with the new balance or `null` when the user is missing.
   */
  async incrementBrainPoints(
    email: string,
    amount: number
  ): Promise<number | null> {
    const result = await this.queryRunner.query<{ brain_points: number }>(
      INCREMENT_BRAIN_POINTS_SQL,
      [email, amount]
    );
    return result.rows[0]?.brain_points ?? null;
  }

  /**
   * @async
   * @function getStudents
   * @description
   * Returns the roster of student accounts sorted by name.
   *
   * - Queries only users assigned the `student` role.
   * - Normalizes rows into the shared `DatabaseUser` representation.
   * - Preserves deterministic ordering by last and then first name.
   *
   * @throws {Error} If the SELECT statement fails when executed.
   *
   * @returns {Promise<DatabaseUser[]>} Resolves with an array of students.
   */
  async getStudents(): Promise<DatabaseUser[]> {
    const result = await this.queryRunner.query<UserRow>(SELECT_STUDENTS_SQL);
    return result.rows.map((row) => this.mapRowToUser(row));
  }

  /**
   * @async
   * @function getTeacherPrompt
   * @description
   * Fetches the earliest created teacher's stored prompt.
   *
   * - Scans teachers ordered by creation timestamp.
   * - Extracts only the prompt column for efficiency.
   * - Supports null prompts to signal unset teacher guidance.
   *
   * @throws {Error} If the SELECT statement encounters an execution failure.
   *
   * @returns {Promise<string | null>} Resolves with the prompt string or `null` if unavailable.
   */
  async getTeacherPrompt(): Promise<string | null> {
    const result = await this.queryRunner.query<{ prompt: string | null }>(
      SELECT_TEACHER_PROMPT_SQL
    );
    return result.rows[0]?.prompt ?? null;
  }

  /**
   * @function mapRowToUser
   * @description
   * Converts a raw database row into the high-level user structure consumed by the app.
   *
   * - Concatenates first and last names into a single `fullName` string.
   * - Normalizes nullable fields to maintain consistent return types.
   * - Ensures timestamps are returned as JavaScript `Date` instances.
   *
   * @param {UserRow} row - Source row retrieved from the data store.
   *
   * @returns {DatabaseUser} Canonical representation of the supplied row.
   */
  private mapRowToUser(row: UserRow): DatabaseUser {
    const fullName = [row.firstname, row.lastname]
      .filter(Boolean)
      .join(" ")
      .trim();
    return {
      email: row.google_email,
      fullName: fullName || row.firstname || row.lastname || "",
      role: row.role,
      brain_points: row.brain_points ?? 0,
      prompt: row.prompt ?? null,
      googleId: row.google_id ?? null,
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    };
  }

  /**
   * @function splitName
   * @description
   * Breaks a full name into first and last components for storage.
   *
   * - Trims extraneous whitespace to avoid inconsistent persistence.
   * - Treats the first token as the first name and the remainder as last name.
   * - Handles empty input by returning blank placeholders.
   *
   * @param {string} name - Full name string supplied during user creation.
   *
   * @returns {{ firstname: string; lastname: string }} Parsed name fragments for persistence.
   */
  private splitName(name: string): { firstname: string; lastname: string } {
    const trimmed = name?.trim();
    if (!trimmed) {
      return { firstname: "", lastname: "" };
    }

    const parts = trimmed.split(/\s+/);
    const firstname = parts.shift() ?? "";
    const lastname = parts.length ? parts.join(" ") : "";
    return { firstname, lastname };
  }
}
