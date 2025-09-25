import { Database } from "@/database";

describe("Database integration with mocked query runner", () => {
  let database: Database;
  let queryRunner: { query: jest.Mock; end?: jest.Mock };

  beforeEach(() => {
    database = new Database("test");
    queryRunner = {
      query: jest.fn(),
      end: jest.fn(),
    };
    (database as unknown as { queryRunner: typeof queryRunner }).queryRunner = queryRunner;
    (database as unknown as { useInMemory: boolean }).useInMemory = false;
  });

  describe("initialize", () => {
    it("executes the schema creation statements", async () => {
      queryRunner.query.mockResolvedValue({ rows: [] });

      await database.initialize();

      expect(queryRunner.query).toHaveBeenCalledTimes(5);
      const executedSql = queryRunner.query.mock.calls.map(([sql]) => sql);
      expect(executedSql[0]).toContain("CREATE TABLE IF NOT EXISTS users");
      expect(executedSql).toEqual(
        expect.arrayContaining([
          expect.stringContaining("CREATE TABLE IF NOT EXISTS classrooms"),
          expect.stringContaining(
            "CREATE TABLE IF NOT EXISTS classroom_students"
          ),
          expect.stringContaining("CREATE TABLE IF NOT EXISTS assignments"),
          expect.stringContaining(
            "CREATE TABLE IF NOT EXISTS classroom_assignments"
          ),
        ])
      );
    });

    it("propagates errors from the query runner", async () => {
      queryRunner.query.mockRejectedValue(new Error("boom"));

      await expect(database.initialize()).rejects.toThrow("boom");
    });
  });

  describe("close", () => {
    it("invokes end when using a pooled connection", async () => {
      await database.close();

      expect(queryRunner.end).toHaveBeenCalledTimes(1);
    });

    it("skips end when running against the in-memory runner", async () => {
      (database as unknown as { useInMemory: boolean }).useInMemory = true;

      await database.close();

      expect(queryRunner.end).not.toHaveBeenCalled();
    });

    it("skips end when the method is not available", async () => {
      delete queryRunner.end;

      await database.close();
    });
  });

  describe("getUserByEmail", () => {
    const row = {
      firstname: "Ada",
      lastname: "Lovelace",
      google_email: "ada@example.com",
      role: "teacher",
      brain_points: 10,
      prompt: "Hello",
      google_id: "gid-1",
      created_at: new Date("2024-01-01T00:00:00Z"),
    };

    it("returns a mapped user when found", async () => {
      queryRunner.query.mockResolvedValue({ rows: [row] });

      const result = await database.getUserByEmail("ada@example.com");

      expect(result).toMatchObject({
        email: "ada@example.com",
        fullName: "Ada Lovelace",
        role: "teacher",
        brain_points: 10,
        prompt: "Hello",
        googleId: "gid-1",
      });
    });

    it("returns null when no user matches", async () => {
      queryRunner.query.mockResolvedValue({ rows: [] });

      const result = await database.getUserByEmail("missing@example.com");

      expect(result).toBeNull();
    });

    it("propagates errors", async () => {
      queryRunner.query.mockRejectedValue(new Error("nope"));

      await expect(database.getUserByEmail("ada@example.com")).rejects.toThrow("nope");
    });
  });

  describe("createUser", () => {
    it("splits the provided name and forwards the insert statement", async () => {
      queryRunner.query.mockResolvedValue({ rows: [] });

      await database.createUser({
        email: "new@example.com",
        fullName: "Alan Mathison Turing",
        role: "student",
        googleId: "gid-2",
      });

      expect(queryRunner.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO users"),
        [
          "Alan",
          "Mathison Turing",
          "new@example.com",
          "student",
          0,
          null,
          "gid-2",
        ]
      );
    });

    it("persists optional prompt when provided", async () => {
      queryRunner.query.mockResolvedValue({ rows: [] });

      await database.createUser({
        email: "teacher@example.com",
        fullName: "Teacher Person",
        role: "teacher",
        googleId: "gid-3",
        prompt: "Guide wisely",
      });

      const lastCall = queryRunner.query.mock.calls.at(-1);
      expect(lastCall).toBeDefined();
      const [, params] = lastCall!;
      expect(params).toEqual([
        "Teacher",
        "Person",
        "teacher@example.com",
        "teacher",
        0,
        "Guide wisely",
        "gid-3",
      ]);
    });
  });

  describe("updatePrompt", () => {
    it("updates the prompt for the specified user", async () => {
      queryRunner.query.mockResolvedValue({ rows: [] });

      await database.updatePrompt("user@example.com", "New Prompt");

      expect(queryRunner.query).toHaveBeenCalledWith(
        expect.stringContaining("SET prompt"),
        ["user@example.com", "New Prompt"]
      );
    });
  });

  describe("incrementBrainPoints", () => {
    it("returns the updated total when the user exists", async () => {
      queryRunner.query.mockResolvedValue({ rows: [{ brain_points: 15 }] });

      const result = await database.incrementBrainPoints("user@example.com", 5);

      expect(result).toBe(15);
    });

    it("returns null when the user does not exist", async () => {
      queryRunner.query.mockResolvedValue({ rows: [] });

      const result = await database.incrementBrainPoints("user@example.com", 5);

      expect(result).toBeNull();
    });
  });

  describe("getStudents", () => {
    it("maps all returned student rows", async () => {
      queryRunner.query.mockResolvedValue({
        rows: [
          {
            firstname: "Ada",
            lastname: "Lovelace",
            google_email: "ada@example.com",
            role: "student",
            brain_points: 12,
            prompt: null,
            google_id: "gid-4",
            created_at: new Date("2024-01-01T00:00:00Z"),
          },
        ],
      });

      const result = await database.getStudents();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        email: "ada@example.com",
        fullName: "Ada Lovelace",
        role: "student",
      });
    });
  });

  describe("classroom operations", () => {
    it("creates a classroom and deduplicates students", async () => {
      const studentCalls: unknown[][] = [];
      queryRunner.query.mockImplementation((sql: string, params?: unknown[]) => {
        if (sql.includes("INSERT INTO classrooms")) {
          return Promise.resolve({ rows: [] });
        }

        if (sql.includes("INSERT INTO classroom_students")) {
          studentCalls.push(params ?? []);
          return Promise.resolve({ rows: [] });
        }

        if (sql.includes("FROM classrooms") && sql.includes("WHERE classroom_id = $1")) {
          return Promise.resolve({
            rows: [
              {
                classroom_id: params?.[0],
                class_name: "Algebra",
                subject: "Math",
                teacher_email: "teacher@example.com",
              },
            ],
          });
        }

        if (sql.includes("FROM classroom_students")) {
          return Promise.resolve({
            rows: [{ student_email: "student@example.com" }],
          });
        }

        if (sql.includes("FROM classroom_assignments")) {
          return Promise.resolve({ rows: [] });
        }

        return Promise.resolve({ rows: [] });
      });

      const classroom = await database.createClassroom({
        className: "Algebra",
        subject: "Math",
        students: ["student@example.com", "student@example.com"],
        teacher: "teacher@example.com",
      });

      const insertCall = queryRunner.query.mock.calls.find(([sql]) =>
        sql.includes("INSERT INTO classrooms")
      );
      expect(insertCall).toBeDefined();
      expect(insertCall?.[1]).toEqual([
        expect.any(String),
        "Algebra",
        "Math",
        "teacher@example.com",
      ]);
      expect(studentCalls).toHaveLength(1);
      expect(studentCalls[0][0]).toEqual(expect.any(String));
      expect(studentCalls[0][1]).toBe("student@example.com");
      expect(Array.from(classroom.students)).toEqual(["student@example.com"]);
      expect(classroom.assignments.size).toBe(0);
    });

    it("retrieves classroom summaries for a teacher", async () => {
      queryRunner.query.mockResolvedValue({
        rows: [
          {
            classroom_id: "c-1",
            class_name: "Algebra",
            subject: "Math",
            teacher_email: "teacher@example.com",
          },
        ],
      });

      const summaries = await database.getClassroomSummariesByTeacher(
        "teacher@example.com"
      );

      expect(queryRunner.query).toHaveBeenCalledWith(
        expect.stringContaining("FROM classrooms"),
        ["teacher@example.com"]
      );
      expect(summaries).toEqual([
        {
          classroomId: "c-1",
          className: "Algebra",
          subject: "Math",
          teacher: "teacher@example.com",
        },
      ]);
    });

    it("retrieves classroom summaries for a student", async () => {
      queryRunner.query.mockResolvedValue({
        rows: [
          {
            classroom_id: "c-2",
            class_name: "Physics",
            subject: "Science",
            teacher_email: "teacher@example.com",
          },
        ],
      });

      const summaries = await database.getClassroomSummariesByStudent(
        "student@example.com"
      );

      expect(queryRunner.query).toHaveBeenCalledWith(
        expect.stringContaining("INNER JOIN classroom_students"),
        ["student@example.com"]
      );
      expect(summaries).toEqual([
        {
          classroomId: "c-2",
          className: "Physics",
          subject: "Science",
          teacher: "teacher@example.com",
        },
      ]);
    });

    it("returns null when classroom is missing", async () => {
      queryRunner.query.mockResolvedValue({ rows: [] });

      const classroom = await database.getClassroomById("missing");

      expect(classroom).toBeNull();
    });

    it("maps classroom details with students and assignments", async () => {
      queryRunner.query.mockImplementation((sql: string, params?: unknown[]) => {
        if (sql.includes("FROM classrooms") && sql.includes("WHERE classroom_id = $1")) {
          return Promise.resolve({
            rows: [
              {
                classroom_id: params?.[0],
                class_name: "History",
                subject: "Social Studies",
                teacher_email: "teacher@example.com",
              },
            ],
          });
        }

        if (sql.includes("FROM classroom_students")) {
          return Promise.resolve({
            rows: [
              { student_email: "student1@example.com" },
              { student_email: "student2@example.com" },
            ],
          });
        }

        if (sql.includes("FROM classroom_assignments")) {
          return Promise.resolve({
            rows: [
              { assignment_id: "a-1" },
              { assignment_id: "a-2" },
            ],
          });
        }

        return Promise.resolve({ rows: [] });
      });

      const classroom = await database.getClassroomById("class-123");

      expect(classroom).not.toBeNull();
      expect(classroom?.className).toBe("History");
      expect(Array.from(classroom!.students)).toEqual([
        "student1@example.com",
        "student2@example.com",
      ]);
      expect(Array.from(classroom!.assignments)).toEqual(["a-1", "a-2"]);
    });

    it("updates classroom metadata", async () => {
      queryRunner.query.mockImplementation((sql: string) => {
        if (sql.startsWith("UPDATE classrooms")) {
          return Promise.resolve({ rows: [] });
        }

        if (sql.includes("FROM classrooms") && sql.includes("WHERE classroom_id = $1")) {
          return Promise.resolve({
            rows: [
              {
                classroom_id: "class-456",
                class_name: "Updated Name",
                subject: "Updated Subject",
                teacher_email: "teacher@example.com",
              },
            ],
          });
        }

        if (sql.includes("FROM classroom_students")) {
          return Promise.resolve({ rows: [] });
        }

        if (sql.includes("FROM classroom_assignments")) {
          return Promise.resolve({ rows: [] });
        }

        return Promise.resolve({ rows: [] });
      });

      const updated = await database.updateClassroom({
        classroomId: "class-456",
        className: "Updated Name",
        subject: "Updated Subject",
      });

      const updateCall = queryRunner.query.mock.calls.find(([sql]) =>
        sql.startsWith("UPDATE classrooms")
      );
      expect(updateCall).toBeDefined();
      expect(updateCall?.[1]).toEqual([
        "Updated Name",
        "Updated Subject",
        "class-456",
      ]);
      expect(updated?.className).toBe("Updated Name");
    });

    it("deletes a classroom", async () => {
      queryRunner.query.mockResolvedValueOnce({
        rows: [{ classroom_id: "class-789" }],
      });

      const deleted = await database.deleteClassroom("class-789");

      expect(queryRunner.query).toHaveBeenCalledWith(
        expect.stringContaining("DELETE FROM classrooms"),
        ["class-789"]
      );
      expect(deleted).toBe(true);
    });

    it("returns false when delete affects no rows", async () => {
      queryRunner.query.mockResolvedValueOnce({ rows: [] });

      const deleted = await database.deleteClassroom("missing");

      expect(deleted).toBe(false);
    });
  });

  describe("getTeacherPrompt", () => {
    it("returns the stored prompt when available", async () => {
      queryRunner.query.mockResolvedValue({ rows: [{ prompt: "Teach with care" }] });

      const result = await database.getTeacherPrompt();

      expect(result).toBe("Teach with care");
    });

    it("returns null when no teacher prompt exists", async () => {
      queryRunner.query.mockResolvedValue({ rows: [] });

      const result = await database.getTeacherPrompt();

      expect(result).toBeNull();
    });
  });
});
