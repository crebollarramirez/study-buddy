# Database Module (server/src/database.ts)

A lightweight persistence layer that wraps PostgreSQL with an optional in-memory fallback for local development and testing. It exposes a small, focused API for common user operations used across the app.

## Highlights

- PostgreSQL connection via `pg.Pool` when a connection string is available
- In-memory query runner when no DB is configured (zero external deps)
- Idempotent initialization (creates `users` table if missing)
- Small API surface: create/get/update users and brain points, query students, teacher prompt
- Clean data mapping to a single `DatabaseUser` shape consumed by the app

---

## Environment & Configuration

You can configure the DB connection in one of two ways:

1. Provide a full connection string via `POSTGRES_URL`

- Example: `postgresql://<user>:<password>@<host>:<port>/<database>`

2. Or provide discrete variables (a connection string will be constructed automatically):

- `PG_USER`
- `PG_HOST`
- `PG_DATABASE`
- `PG_PORT`

If neither is provided, the module falls back to an in-memory store. On successful connection it logs:

- `✅ Connected to PostgreSQL database successfully`

If it cannot connect, it logs:

- `❌ Failed to connect to PostgreSQL database: <error>` and falls back to in-memory.

---

## Data Model

The module persists a single table: `users`.

DDL used at startup (simplified):

```
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
```

### Row shape (internal)

- id: number (serial)
- firstname: string
- lastname: string
- google_email: string (unique)
- role: string (e.g., "student", "teacher")
- brain_points: number
- prompt: string | null
- google_id: string | null
- created_at: Date

### Public shape (returned by the module)

`DatabaseUser`:

- email: string (from `google_email`)
- fullName: string (concatenation of first and last names)
- role: string
- brain_points: number
- prompt: string | null
- googleId: string | null
- createdAt: Date

## API Reference

### constructor(connectionString?: string)

- If provided, attempts to create a `pg.Pool`.
- If omitted or connection fails, falls back to in-memory.

### initialize(): Promise<void>

- Creates the `users` table in Postgres.
- No-op in memory.

### close(): Promise<void>

- Closes the `pg.Pool` if connected to Postgres.
- No-op in memory.

### getUserByEmail(email: string): Promise<DatabaseUser | null>

- Returns a single user mapped to `DatabaseUser`, or `null`.

### createUser(params: CreateUserInput): Promise<void>

- Inserts a new user if not present (guarded by unique email).
- Splits `fullName` into `firstname` and `lastname`.

### updatePrompt(email: string, prompt: string | null): Promise<void>

- Sets or clears the prompt for the user.

### incrementBrainPoints(email: string, amount: number): Promise<number | null>

- Atomically increments points and returns the new balance, or `null` if user not found.

### getStudents(): Promise<DatabaseUser[]>

- Returns students ordered by last name, then first name.

### getTeacherPrompt(): Promise<string | null>

- Returns the earliest teacher's prompt or `null`.

---

## In-memory Fallback

When Postgres is unavailable or misconfigured, the module uses an internal `InMemoryQueryRunner`:

- Stores users in a process-local Map keyed by email
- Emulates only the subset of SQL used by this module
- Useful for tests and local prototyping

Note: In-memory data is ephemeral and cleared when the process exits.

---

## Error Handling & Logging

- Connection success/failure is logged at startup.
- SQL operations surface errors to callers; you can `try/catch` at call sites.
- In-memory runner throws when it encounters unsupported SQL to avoid silent failures.

---

## Tips

- Always call `await db.initialize()` after constructing the Database.
- Use `POSTGRES_URL` in production; let discrete PG\_\* vars serve local dev.
- Treat `brain_points` as an integer counter; only use `incrementBrainPoints` to change it.
- `fullName` is derived; update name by re-calling `createUser` with the new split or providing an update method if needed.
