import { Database } from "@/database";

describe("Database integration with mocked query runner", () => {
  let database: Database;
  let queryRunner: { query: jest.Mock; end?: jest.Mock };

  beforeEach(() => {
    database = new Database();
    queryRunner = {
      query: jest.fn(),
      end: jest.fn(),
    };
    (database as unknown as { queryRunner: typeof queryRunner }).queryRunner = queryRunner;
    (database as unknown as { useInMemory: boolean }).useInMemory = false;
  });

  describe("initialize", () => {
    it("executes the users table creation statement", async () => {
      queryRunner.query.mockResolvedValue({ rows: [] });

      await database.initialize();

      expect(queryRunner.query).toHaveBeenCalledTimes(1);
      const [sql] = queryRunner.query.mock.calls[0];
      expect(sql).toContain("CREATE TABLE IF NOT EXISTS users");
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
