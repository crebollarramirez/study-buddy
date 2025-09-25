# Database Module (server/src/database.ts)

The database layer encapsulates all persistence for users, classrooms, and
assignment references. It wraps PostgreSQL through a small, well-typed API and
falls back to an in-memory implementation when a database connection is not
available. All application code interacts with data exclusively through the
`Database` class—route handlers and sockets never issue raw SQL statements.

## Highlights

- Automatic schema provisioning for users, classrooms, student membership, and
  assignment references via `initialize()`.
- Optional in-memory store that mirrors the public API for local testing.
- Strongly typed helpers for user data, classroom summaries, and classroom
  details (including set semantics for students/assignments).
- Convenience methods for incrementing brain points, fetching rosters, and
  enforcing classroom ownership rules in higher layers.

---

## Schema Overview

### `users`

Stores teachers and students. Created automatically when `initialize()` runs.

| Column        | Type      | Notes                                    |
| ------------- | --------- | ---------------------------------------- |
| `id`          | SERIAL PK | internal identifier                      |
| `firstname`   | TEXT      | derived from the provided full name      |
| `lastname`    | TEXT      | derived from the provided full name      |
| `google_email`| TEXT      | unique login email (used as foreign key) |
| `role`        | TEXT      | `teacher` or `student`                   |
| `brain_points`| INTEGER   | defaults to `0`                          |
| `prompt`      | TEXT      | optional mentor prompt                   |
| `google_id`   | TEXT      | OAuth provider id                        |
| `created_at`  | TIMESTAMP | default `NOW()`                          |

### `classrooms`

Represents a classroom owned by a teacher. Ownership is stored on the row and
is used to enforce update/delete permissions.

| Column          | Type | Notes                                                      |
| --------------- | ---- | ---------------------------------------------------------- |
| `classroom_id`  | UUID | primary key, generated with `crypto.randomUUID()`          |
| `class_name`    | TEXT | human readable name                                        |
| `subject`       | TEXT | subject area                                               |
| `teacher_email` | TEXT | references `users.google_email` (creator/admin teacher)    |

### `classroom_students`

Maintains classroom membership with set semantics—each `(classroom_id,
student_email)` pair is unique.

| Column          | Type | Notes                                             |
| --------------- | ---- | ------------------------------------------------- |
| `classroom_id`  | UUID | references `classrooms.classroom_id`              |
| `student_email` | TEXT | references `users.google_email`                   |
| Primary key     |      | composite `(classroom_id, student_email)`         |

### `assignments`

Stores assignment metadata (currently limited to optional `bookId`/`prompt`).
Assignments are referenced by classrooms through the join table below.

| Column          | Type | Notes                                 |
| --------------- | ---- | ------------------------------------- |
| `assignment_id` | UUID | primary key                           |
| `book_id`       | TEXT | optional resource identifier          |
| `prompt`        | TEXT | optional textual prompt               |

### `classroom_assignments`

Associates assignment ids with classrooms using set semantics.

| Column          | Type | Notes                                                 |
| --------------- | ---- | ----------------------------------------------------- |
| `classroom_id`  | UUID | references `classrooms.classroom_id`                  |
| `assignment_id` | UUID | references `assignments.assignment_id`                |
| Primary key     |      | composite `(classroom_id, assignment_id)`             |

> **Ownership rules:** The teacher who creates a classroom is its administrator.
> Only that teacher can update metadata (`className`, `subject`) or delete the
> classroom. Membership changes are out of scope for this iteration.

---

## Public API

### Construction & Lifecycle

- `new Database(connectionString?)` – uses PostgreSQL when a connection string
  is provided, otherwise falls back to the in-memory store.
- `initialize()` – creates the tables listed above if they do not already
  exist. Must be called before serving requests.
- `close()` – closes the PostgreSQL pool when in use; no-op for in-memory.

### User helpers

- `createUser({ email, fullName, role, googleId, prompt? })`
- `getUserByEmail(email)` → `DatabaseUser | null`
- `updatePrompt(email, prompt)`
- `incrementBrainPoints(email, amount)` → new total or `null`
- `getStudents()` → ordered array of student `DatabaseUser`
- `getTeacherPrompt()` → earliest teacher prompt or `null`

### Classroom helpers

All classroom and assignment lookups flow through these methods.

- `createClassroom({ className, subject, students, teacher })` →
  `DatabaseClassroom`
  - Deduplicates student emails.
  - Seeds `assignments` as an empty set.
- `getClassroomSummariesByTeacher(teacherEmail)` → `ClassroomSummary[]`
- `getClassroomSummariesByStudent(studentEmail)` → `ClassroomSummary[]`
- `getClassroomById(classroomId)` → `DatabaseClassroom | null`
- `updateClassroom({ classroomId, className?, subject? })` →
  `DatabaseClassroom | null`
- `deleteClassroom(classroomId)` → `boolean`

A `DatabaseClassroom` exposes:

```ts
{
  classroomId: string;
  className: string;
  subject: string;
  teacher: string; // creator/admin email
  students: Set<string>; // member emails, unique
  assignments: Set<string>; // assignment ids, unique
}
```

---

## `/classroom` HTTP Routes

All classroom endpoints are mounted from `server/src/routes/classroom.ts` and
require authentication. Mutating routes additionally require the `teacher`
role. Handlers rely entirely on the `Database` API described above.

### `GET /classroom`

List or fetch classrooms for the authenticated user.

Query parameters:

- `classroomId` – when present, returns detail view.
- `shape=ids|full` – list mode response shape. Defaults to `full` for teachers
  and `ids` for students.

Responses:

- List (student, default `ids`): `{ "classrooms": ["uuid-1", "uuid-2"] }`
- List (teacher, default `full`):
  ```json
  {
    "classrooms": [
      { "classroomId": "uuid-10", "className": "Algebra I", "subject": "Math", "teacher": "teacher@school.edu" }
    ]
  }
  ```
- Detail (owner or member):
  ```json
  {
    "classroom": {
      "classroomId": "uuid-10",
      "className": "Algebra I",
      "subject": "Math",
      "teacher": "teacher@school.edu",
      "students": ["sally@school.edu"],
      "assignments": ["assign-1"]
    }
  }
  ```

Error codes:

- `401` – unauthenticated.
- `403` – authenticated but lacks role or membership/ownership.
- `404` – classroom not found (detail mode).
- `400` – invalid `shape` parameter.

### `POST /classroom/create`

Creates a classroom for the authenticated teacher.

Body:

```json
{
  "className": "Algebra I",
  "subject": "Math",
  "students": ["student@example.com"]
}
```

Validates email format, deduplicates students, and records the current teacher
as admin. Responds with `201` and the full classroom payload. Common errors:
`400` for invalid input, `401/403` for missing authentication or role.

### `PATCH /classroom/update`

Updates `className` and/or `subject` for an owned classroom.

Body must include `classroomId` plus at least one field to update. Only the
admin teacher can perform the update. Responds with the updated classroom on
success. Errors: `400` invalid input, `403` when not the owner, `404` when the
classroom is missing.

### `DELETE /classroom/:classroomId`

Deletes a classroom and cascades membership/assignment references. Only the
admin teacher may delete. Responds with `204` on success, `403` when forbidden,
`404` when the classroom does not exist.

---

## Notes & Tips

- Always call `await database.initialize()` during application startup.
- All classroom membership and assignment sets are managed with set semantics—
  duplicates are automatically ignored.
- Ownership checks (teacher-only updates/deletes) are enforced at the route
  layer using data returned from the `Database` class.
- The in-memory implementation mirrors the PostgreSQL API, enabling unit,
  integration, and end-to-end tests without external services when desired.
