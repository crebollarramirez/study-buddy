# Socratic Chat Memory — Postgres Schema

## Enum Types

### `message_role`

* `system`
* `user`
* `assistant`

---

## Tables

### `conversations`

| Column       | Type          | Null | Default             | Notes                                  |
| ------------ | ------------- | ---- | ------------------- | -------------------------------------- |
| `id`         | `UUID`        | NO   | `gen_random_uuid()` | Primary key                            |
| `student_id` | `TEXT`        | NO   | —                   | Mongo ObjectId (string) of the student |
| `teacher_id` | `TEXT`        | NO   | —                   | Mongo ObjectId (string) of the teacher |
| `topic`      | `TEXT`        | NO   | —                   | Topic copied from teacher at creation  |
| `created_at` | `TIMESTAMPTZ` | NO   | `now()`             | Row creation time                      |
| `updated_at` | `TIMESTAMPTZ` | NO   | `now()`             | Updated automatically in app layer     |

**Constraints**

* `PRIMARY KEY (id)`

---

### `messages`

| Column            | Type           | Null | Default             | Notes                                                              |
| ----------------- | -------------- | ---- | ------------------- | ------------------------------------------------------------------ |
| `id`              | `UUID`         | NO   | `gen_random_uuid()` | Primary key                                                        |
| `conversation_id` | `UUID`         | NO   | —                   | **FK** → `conversations(id)` **ON DELETE CASCADE**                 |
| `role`            | `message_role` | NO   | —                   | `system` \| `user` \| `assistant`                                  |
| `content`         | `TEXT`         | NO   | —                   | Full message text                                                  |
| `question_hash`   | `TEXT`         | YES  | —                   | Set **only** for assistant questions (normalized + hashed content) |
| `created_at`      | `TIMESTAMPTZ`  | NO   | `now()`             | Insert time                                                        |

**Constraints**

* `PRIMARY KEY (id)`
* `FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE`
* `UNIQUE (conversation_id, question_hash)` — allows multiple `NULL`s; enforces **no duplicate assistant questions per conversation** when `question_hash` is set

**Indexes**

* `idx_messages_conv_created_at_desc` on `(conversation_id, created_at DESC)` — fast sliding-window reads
* The unique constraint also creates an index on `(conversation_id, question_hash)`

---

## Relationships (ER overview)

```
conversations (1) ────< (many) messages
      id                          conversation_id
```

* Deleting a conversation cascades and deletes its messages.

---

## Typical Access Patterns

* **Fetch last 15 turns for a conversation (sliding window):**

  ```sql
  SELECT role, content, created_at
  FROM messages
  WHERE conversation_id = $1
  ORDER BY created_at DESC
  LIMIT 15;
  ```

* **Insert assistant question with “no-repeat” guard:**

  ```sql
  INSERT INTO messages (conversation_id, role, content, question_hash)
  VALUES ($1, 'assistant', $2, $3)
  ON CONFLICT (conversation_id, question_hash) DO NOTHING;
  ```

* **Insert user message:**

  ```sql
  INSERT INTO messages (conversation_id, role, content)
  VALUES ($1, 'user', $2);
  ```
