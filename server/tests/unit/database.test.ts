import { Database } from "@/database";

type UserRowLike = {
  firstname: string;
  lastname: string;
  google_email: string;
  role: string;
  brain_points: number | null;
  prompt: string | null;
  google_id: string | null;
  created_at: Date;
};

describe("Database utility methods", () => {
  let database: Database;

  beforeEach(() => {
    database = new Database();
  });

  describe("splitName", () => {
    const invokeSplitName = (name: string) =>
      (database as unknown as { splitName(name: string): { firstname: string; lastname: string } }).splitName(name);

    it("trims whitespace and splits first and last name", () => {
      const result = invokeSplitName("  Ada   Lovelace  ");
      expect(result).toEqual({ firstname: "Ada", lastname: "Lovelace" });
    });

    it("handles single-word names by treating the remainder as empty", () => {
      const result = invokeSplitName("Plato");
      expect(result).toEqual({ firstname: "Plato", lastname: "" });
    });

    it("returns blanks when the supplied name is empty", () => {
      const result = invokeSplitName("   ");
      expect(result).toEqual({ firstname: "", lastname: "" });
    });

    it("preserves multi-word last names in the lastname field", () => {
      const result = invokeSplitName("Gabriel García Márquez");
      expect(result).toEqual({ firstname: "Gabriel", lastname: "García Márquez" });
    });
  });

  describe("mapRowToUser", () => {
    type DatabaseUserShape = NonNullable<
      ReturnType<Database["getUserByEmail"]> extends Promise<infer U>
        ? U
        : never
    >;

    const invokeMapRowToUser = (row: UserRowLike): DatabaseUserShape =>
      (database as unknown as {
        mapRowToUser(row: UserRowLike): DatabaseUserShape;
      }).mapRowToUser(row);

    it("maps database rows into the public shape", () => {
      const createdAt = new Date("2024-01-01T00:00:00Z");
      const result = invokeMapRowToUser({
        firstname: "Grace",
        lastname: "Hopper",
        google_email: "grace@example.com",
        role: "teacher",
        brain_points: 42,
        prompt: "Ship it!",
        google_id: "gid-123",
        created_at: createdAt,
      });

      expect(result).toEqual({
        email: "grace@example.com",
        fullName: "Grace Hopper",
        role: "teacher",
        brain_points: 42,
        prompt: "Ship it!",
        googleId: "gid-123",
        createdAt,
      });
    });

    it("normalizes missing fields and generates a fallback full name", () => {
      const createdAt = new Date("2024-02-02T12:00:00Z");
      const result = invokeMapRowToUser({
        firstname: "",
        lastname: "Solo",
        google_email: "solo@example.com",
        role: "student",
        brain_points: null,
        prompt: null,
        google_id: null,
        created_at: createdAt,
      });

      expect(result).toEqual({
        email: "solo@example.com",
        fullName: "Solo",
        role: "student",
        brain_points: 0,
        prompt: null,
        googleId: null,
        createdAt,
      });
    });
  });
});
