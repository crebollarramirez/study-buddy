/* eslint-disable @typescript-eslint/no-var-requires */
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
  firstname: string;
  lastname: string;
  name: string;
  role: string;
  brain_points: number;
  prompt: string | null;
  googleId: string | null;
  createdAt: Date;
}

export interface CreateUserInput {
  email: string;
  name: string;
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
  SELECT firstname, lastname, google_email, brain_points
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

class InMemoryQueryRunner implements Queryable {
  private users = new Map<string, UserRow>();

  async query<T>(sql: string, params: unknown[] = []): Promise<QueryResult<T>> {
    const normalized = sql.replace(/\s+/g, " ").trim().toLowerCase();

    if (normalized.startsWith("create table")) {
      // Table creation is a no-op for in-memory implementation.
      return { rows: [] as T[] };
    }

    if (normalized.startsWith("select") && normalized.includes("where google_email = $1")) {
      const email = params[0] as string;
      const user = this.users.get(email);
      return { rows: (user ? [user] : []) as unknown as T[] };
    }

    if (normalized.startsWith("insert into users")) {
      const [firstname, lastname, email, role, brainPoints, prompt, googleId] =
        params as [string, string, string, string, number, string | null, string | null];

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

    if (normalized.startsWith("update users") && normalized.includes("set prompt")) {
      const [email, prompt] = params as [string, string | null];
      const existing = this.users.get(email);
      if (existing) {
        existing.prompt = prompt ?? null;
      }
      return { rows: [] as T[] };
    }

    if (normalized.startsWith("update users") && normalized.includes("brain_points = brain_points + $2")) {
      const [email, increment] = params as [string, number];
      const existing = this.users.get(email);
      if (existing) {
        existing.brain_points += increment;
        return { rows: [{ brain_points: existing.brain_points }] as unknown as T[] };
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

    if (normalized.startsWith("select prompt") && normalized.includes("where role = 'teacher'")) {
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

export class Database {
  private queryRunner: Queryable;
  private useInMemory: boolean;

  constructor(private connectionString?: string) {
    this.queryRunner = this.createQueryRunner(connectionString);
    this.useInMemory = this.queryRunner instanceof InMemoryQueryRunner;
  }

  private createQueryRunner(connectionString?: string): Queryable {
    if (connectionString) {
      try {
        // Dynamically require pg to keep compatibility when dependency is unavailable (e.g., tests).
        const pg = require("pg");
        return new pg.Pool({ connectionString });
      } catch (error) {
        console.warn(
          "pg module not available, falling back to in-memory query runner."
        );
      }
    }

    return new InMemoryQueryRunner();
  }

  async initialize(): Promise<void> {
    await this.queryRunner.query(CREATE_USERS_TABLE_SQL);
  }

  async close(): Promise<void> {
    if (!this.useInMemory && this.queryRunner.end) {
      await this.queryRunner.end();
    }
  }

  async getUserByEmail(email: string): Promise<DatabaseUser | null> {
    const result = await this.queryRunner.query<UserRow>(SELECT_USER_BY_EMAIL_SQL, [
      email,
    ]);
    const row = result.rows[0];
    return row ? this.mapRowToUser(row) : null;
  }

  async createUser({ email, name, role, googleId, prompt }: CreateUserInput) {
    const { firstname, lastname } = this.splitName(name);
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

  async updatePrompt(email: string, prompt: string | null): Promise<void> {
    await this.queryRunner.query(UPDATE_PROMPT_SQL, [email, prompt]);
  }

  async incrementBrainPoints(email: string, amount: number): Promise<number | null> {
    const result = await this.queryRunner.query<{ brain_points: number }>(
      INCREMENT_BRAIN_POINTS_SQL,
      [email, amount]
    );
    return result.rows[0]?.brain_points ?? null;
  }

  async getStudents(): Promise<DatabaseUser[]> {
    const result = await this.queryRunner.query<UserRow>(SELECT_STUDENTS_SQL);
    return result.rows.map((row) => this.mapRowToUser(row));
  }

  async getTeacherPrompt(): Promise<string | null> {
    const result = await this.queryRunner.query<{ prompt: string | null }>(
      SELECT_TEACHER_PROMPT_SQL
    );
    return result.rows[0]?.prompt ?? null;
  }

  private mapRowToUser(row: UserRow): DatabaseUser {
    const name = [row.firstname, row.lastname].filter(Boolean).join(" ").trim();
    return {
      email: row.google_email,
      firstname: row.firstname,
      lastname: row.lastname,
      name: name || row.firstname || row.lastname || "",
      role: row.role,
      brain_points: row.brain_points ?? 0,
      prompt: row.prompt ?? null,
      googleId: row.google_id ?? null,
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    };
  }

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
