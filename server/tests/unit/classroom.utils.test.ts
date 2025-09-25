import { isValidEmail, sanitizeStudentEmails } from "@/routes/classroom";

describe("sanitizeStudentEmails", () => {
  it("returns an empty array when value is nullish", () => {
    expect(sanitizeStudentEmails(undefined)).toEqual([]);
    expect(sanitizeStudentEmails(null)).toEqual([]);
  });

  it("deduplicates and trims valid string entries", () => {
    const result = sanitizeStudentEmails([
      " alice@example.com ",
      "bob@example.com",
      "alice@example.com",
      123,
      null,
    ]);

    expect(result).toEqual(["alice@example.com", "bob@example.com"]);
  });

  it("returns null for non-array inputs", () => {
    expect(sanitizeStudentEmails("not-an-array")).toBeNull();
  });
});

describe("isValidEmail", () => {
  it("accepts typical email addresses", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
  });

  it("rejects malformed inputs", () => {
    expect(isValidEmail("missing-at-symbol")).toBe(false);
    expect(isValidEmail("foo@bar")).toBe(false);
    expect(isValidEmail("foo@bar.")).toBe(false);
  });
});
