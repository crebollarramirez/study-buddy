import { Pool } from "pg";

export interface UserRecord {
  id: number;
  firstname: string;
  lastname: string;
  google_email: string;
  role: string;
  brain_points: number;
  prompt: string | null;
}

export interface CreateUserInput {
  firstname: string;
  lastname: string;
  google_email: string;
  role: string;
  brain_points?: number;
  prompt?: string | null;
}

export class PostgresDatabase {
  private pool: Pool;

  constructor(private readonly connectionString: string) {
    if (!connectionString) {
      throw new Error("POSTGRES_URL environment variable is not set");
    }

    this.pool = new Pool({ connectionString });
  }

  async initialize(): Promise<void> {
    await this.pool.query("SELECT 1");
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS "USERS" (
        id SERIAL PRIMARY KEY,
        firstname TEXT NOT NULL,
        lastname TEXT NOT NULL,
        google_email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL DEFAULT 'student',
        brain_points INTEGER NOT NULL DEFAULT 0,
        prompt TEXT
      )
    `);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  async findUserByEmail(googleEmail: string): Promise<UserRecord | null> {
    const result = await this.pool.query(
      'SELECT id, firstname, lastname, google_email, role, brain_points, prompt FROM "USERS" WHERE google_email = $1',
      [googleEmail]
    );

    if (result.rowCount === 0) {
      return null;
    }

    return result.rows[0] as UserRecord;
  }

  async createUser(user: CreateUserInput): Promise<UserRecord> {
    const { firstname, lastname, google_email, role, brain_points = 0, prompt = null } = user;

    const result = await this.pool.query(
      `
        INSERT INTO "USERS" (firstname, lastname, google_email, role, brain_points, prompt)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, firstname, lastname, google_email, role, brain_points, prompt
      `,
      [firstname, lastname, google_email, role, brain_points, prompt]
    );

    return result.rows[0] as UserRecord;
  }

  async listStudents(): Promise<UserRecord[]> {
    const result = await this.pool.query(
      'SELECT id, firstname, lastname, google_email, role, brain_points, prompt FROM "USERS" WHERE role = $1',
      ["student"]
    );

    return result.rows as UserRecord[];
  }

  async updateUserPrompt(googleEmail: string, prompt: string | null): Promise<UserRecord | null> {
    const result = await this.pool.query(
      `
        UPDATE "USERS"
        SET prompt = $2
        WHERE google_email = $1
        RETURNING id, firstname, lastname, google_email, role, brain_points, prompt
      `,
      [googleEmail, prompt]
    );

    if (result.rowCount === 0) {
      return null;
    }

    return result.rows[0] as UserRecord;
  }

  async incrementBrainPoints(googleEmail: string, points: number): Promise<UserRecord | null> {
    const result = await this.pool.query(
      `
        UPDATE "USERS"
        SET brain_points = brain_points + $2
        WHERE google_email = $1
        RETURNING id, firstname, lastname, google_email, role, brain_points, prompt
      `,
      [googleEmail, points]
    );

    if (result.rowCount === 0) {
      return null;
    }

    return result.rows[0] as UserRecord;
  }

  async getTeacherPrompt(): Promise<string | null> {
    const result = await this.pool.query(
      'SELECT prompt FROM "USERS" WHERE role = $1 ORDER BY id ASC LIMIT 1',
      ["teacher"]
    );

    if (result.rowCount === 0) {
      return null;
    }

    return result.rows[0].prompt ?? null;
  }
}
