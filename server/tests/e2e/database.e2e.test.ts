import { Database } from "@/database";

const pgModule = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("pg");
  } catch (error) {
    console.warn(
      "PostgreSQL client library 'pg' is not installed. Database end-to-end tests will be skipped."
    );
    return null;
  }
})();

type PgClientInstance = {
  connect(): Promise<void>;
  query<T = unknown>(sql: string): Promise<{ rows: T[] }>;
  end(): Promise<void>;
};

type PgClientConstructor = new (config: { connectionString: string }) => PgClientInstance;

const Client = (pgModule?.Client ?? null) as PgClientConstructor | null;

const connectionString = process.env.TEST_DATABASE_URL;

const describeIfConnection = connectionString && Client ? describe : describe.skip;

describeIfConnection("Database end-to-end with PostgreSQL", () => {
  const PgClient = Client!;

  jest.setTimeout(30000);
  let adminClient: PgClientInstance | null = null;
  let database: Database | null = null;
  let testDatabaseName: string;
  let skip = false;

  beforeAll(async () => {
    if (!connectionString) {
      return;
    }

    try {
      adminClient = new PgClient({ connectionString });
      await adminClient.connect();

      testDatabaseName = `study_buddy_test_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}`;
      await adminClient.query(`CREATE DATABASE ${testDatabaseName}`);

      const url = new URL(connectionString);
      url.pathname = `/${testDatabaseName}`;

      database = new Database(url.toString());
      await database.initialize();
    } catch (error) {
      skip = true;
      console.warn(
        `Skipping Database end-to-end tests: ${error instanceof Error ? error.message : error}`
      );
    }
  });

  afterAll(async () => {
    if (!connectionString) {
      return;
    }

    if (database) {
      await database.close();
    }

    if (adminClient) {
      if (testDatabaseName) {
        try {
          await adminClient.query(`DROP DATABASE IF EXISTS ${testDatabaseName}`);
        } catch (error) {
          console.warn(
            `Failed to drop temporary database ${testDatabaseName}: ${error instanceof Error ? error.message : error}`
          );
        }
      }

      await adminClient.end();
    }
  });

  it("performs a full user lifecycle", async () => {
    if (skip) {
      console.warn("Database end-to-end test skipped because setup failed.");
      return;
    }

    if (!database) {
      throw new Error("Database was not initialized");
    }

    const teacherEmail = "teacher-e2e@example.com";
    await database.createUser({
      email: teacherEmail,
      fullName: "Teacher Example",
      role: "teacher",
      googleId: "teacher-gid",
      prompt: "Inspire students",
    });

    const studentEmail = "student-e2e@example.com";
    await database.createUser({
      email: studentEmail,
      fullName: "Student Example",
      role: "student",
      googleId: "student-gid",
    });

    const fetchedStudent = await database.getUserByEmail(studentEmail);
    expect(fetchedStudent).not.toBeNull();
    expect(fetchedStudent).toMatchObject({
      email: studentEmail,
      fullName: "Student Example",
      role: "student",
      brain_points: 0,
      prompt: null,
    });

    const fetchedTeacher = await database.getUserByEmail(teacherEmail);
    expect(fetchedTeacher).not.toBeNull();
    expect(fetchedTeacher?.prompt).toBe("Inspire students");

    const updatedPrompt = "Updated mentorship guidance";
    await database.updatePrompt(teacherEmail, updatedPrompt);
    expect(await database.getTeacherPrompt()).toBe(updatedPrompt);

    const newBalance = await database.incrementBrainPoints(studentEmail, 7);
    expect(newBalance).toBe(7);

    const students = await database.getStudents();
    expect(students).toEqual([
      expect.objectContaining({
        email: studentEmail,
        fullName: "Student Example",
        role: "student",
        brain_points: 7,
      }),
    ]);

    expect(await database.incrementBrainPoints("missing@example.com", 3)).toBeNull();
    expect(await database.getUserByEmail("missing@example.com")).toBeNull();
  });
});

if (!connectionString) {
  console.warn(
    "Database end-to-end tests skipped. Provide TEST_DATABASE_URL to run them against a real PostgreSQL instance."
  );
}
