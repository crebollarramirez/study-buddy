import { makeGoogleVerify, GoogleProfile } from "src/config/googleVerify";

describe("makeGoogleVerify", () => {
  const mockDatabase = {
    getUserByEmail: jest.fn(),
  };

  const baseProfile: GoogleProfile = {
    id: "gid-123",
    displayName: "Ada Lovelace",
    emails: [{ value: "ada@example.com" }],
  };

  const done = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return error if no email in profile", async () => {
    const profile = { ...baseProfile, emails: [] };
    await makeGoogleVerify(mockDatabase as any)("", "", profile, done);

    expect(done).toHaveBeenCalledWith(expect.any(Error));
  });

  it("should return userData with isNewUser=true if user does not exist", async () => {
    mockDatabase.getUserByEmail.mockResolvedValueOnce(null);

    await makeGoogleVerify(mockDatabase as any)("", "", baseProfile, done);

    expect(mockDatabase.getUserByEmail).toHaveBeenCalledWith("ada@example.com");
    expect(done).toHaveBeenCalledWith(
      null,
      expect.objectContaining({
        email: "ada@example.com",
        fullName: "Ada Lovelace",
        googleId: "gid-123",
        isNewUser: true,
        role: "student", // default role when new
      })
    );
  });

  it("should return userData with isNewUser=false if user already exists", async () => {
    mockDatabase.getUserByEmail.mockResolvedValueOnce({
      email: "ada@example.com",
      role: "Teacher",
      fullName: "Ada Lovelace",
    });

    await makeGoogleVerify(mockDatabase as any)("", "", baseProfile, done);

    expect(done).toHaveBeenCalledWith(
      null,
      expect.objectContaining({
        email: "ada@example.com",
        isNewUser: false,
        role: "Teacher", // keep role from DB
      })
    );
  });

  it("should call done with error if DB lookup throws", async () => {
    const error = new Error("DB error");
    mockDatabase.getUserByEmail.mockRejectedValueOnce(error);

    await makeGoogleVerify(mockDatabase as any)("", "", baseProfile, done);

    expect(done).toHaveBeenCalledWith(error);
  });
});
