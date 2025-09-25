import { Database } from "@/database";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const pgModule = (() => {
  try {
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

type PgClientConstructor = new (config: {
  connectionString: string;
}) => PgClientInstance;

const Client = (pgModule?.Client ?? null) as PgClientConstructor | null;

const connectionString = process.env.TEST_DATABASE_URL;

// Add debugging information
console.log("🔍 E2E Test Debug Info:");
console.log("  TEST_DATABASE_URL:", connectionString ? "✅ Set" : "❌ Not set");
console.log("  Connection String:", connectionString || "undefined");
console.log(
  "  PostgreSQL Client:",
  Client ? "✅ Available" : "❌ Not available"
);

if (!connectionString) {
  console.warn(
    "⚠️  Database end-to-end tests will be SKIPPED. Set TEST_DATABASE_URL to enable them."
  );
}

if (!Client) {
  console.warn(
    "⚠️  PostgreSQL client 'pg' not found. Install with: npm install pg @types/pg"
  );
}

const describeIfConnection =
  connectionString && Client ? describe : describe.skip;

describeIfConnection("Database end-to-end with PostgreSQL", () => {
  const PgClient = Client!;

  jest.setTimeout(30000);
  let adminClient: PgClientInstance | null = null;
  let database: Database | null = null;
  let testDatabaseName: string;
  let skip = false;

  beforeAll(async () => {
    if (!connectionString) {
      console.log("⚠️  No connection string provided, skipping setup");
      return;
    }

    try {
      console.log("🚀 Starting E2E database test setup...");
      console.log("📡 Attempting to connect to:", connectionString);

      adminClient = new PgClient({ connectionString });
      await adminClient.connect();
      console.log("✅ Successfully connected to PostgreSQL server");

      testDatabaseName = `study_buddy_test_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}`;

      console.log(`📦 Creating test database: ${testDatabaseName}`);
      await adminClient.query(`CREATE DATABASE ${testDatabaseName}`);
      console.log("✅ Test database created successfully");

      const url = new URL(connectionString);
      url.pathname = `/${testDatabaseName}`;
      const testDbUrl = url.toString();

      console.log("🔧 Initializing Database class with:", testDbUrl);
      database = new Database(testDbUrl);
      await database.initialize();
      console.log("✅ Database class initialized and tables created");

      console.log("🎉 E2E test setup completed successfully");
    } catch (error) {
      skip = true;
      console.error("❌ E2E test setup failed:");
      console.error(
        "   Error type:",
        error instanceof Error ? error.constructor.name : typeof error
      );
      console.error(
        "   Error message:",
        error instanceof Error ? error.message : String(error)
      );
      console.error("   Connection string used:", connectionString);

      if (error instanceof Error && error.stack) {
        console.error("   Stack trace:", error.stack);
      }

      console.warn(
        "⚠️  Database end-to-end tests will be skipped due to setup failure"
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
          await adminClient.query(
            `DROP DATABASE IF EXISTS ${testDatabaseName}`
          );
        } catch (error) {
          console.warn(
            `Failed to drop temporary database ${testDatabaseName}: ${
              error instanceof Error ? error.message : error
            }`
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

    expect(
      await database.incrementBrainPoints("missing@example.com", 3)
    ).toBeNull();
    expect(await database.getUserByEmail("missing@example.com")).toBeNull();

    const classroom = await database.createClassroom({
      className: "Algebra I",
      subject: "Mathematics",
      students: [studentEmail],
      teacher: teacherEmail,
    });

    expect(classroom.teacher).toBe(teacherEmail);
    expect(classroom.students.has(studentEmail)).toBe(true);

    const teacherSummaries = await database.getClassroomSummariesByTeacher(
      teacherEmail
    );
    expect(teacherSummaries.map((summary) => summary.classroomId)).toContain(
      classroom.classroomId
    );

    const studentSummaries = await database.getClassroomSummariesByStudent(
      studentEmail
    );
    expect(studentSummaries.map((summary) => summary.classroomId)).toContain(
      classroom.classroomId
    );

    const detailed = await database.getClassroomById(classroom.classroomId);
    expect(detailed?.students.has(studentEmail)).toBe(true);

    const updated = await database.updateClassroom({
      classroomId: classroom.classroomId,
      className: "Algebra II",
    });
    expect(updated?.className).toBe("Algebra II");

    expect(await database.deleteClassroom(classroom.classroomId)).toBe(true);
    expect(await database.getClassroomById(classroom.classroomId)).toBeNull();
  });
});

if (!connectionString) {
  console.warn(
    "Database end-to-end tests skipped. Provide TEST_DATABASE_URL to run them against a real PostgreSQL instance."
  );
}
