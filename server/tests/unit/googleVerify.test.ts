import { makeGoogleVerify, GoogleProfile } from "src/config/googleVerify";

describe("makeGoogleVerify", () => {
  const mockUsers = {
    findOne: jest.fn(),
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
    await makeGoogleVerify(mockUsers as any)("", "", profile, done);

    expect(done).toHaveBeenCalledWith(expect.any(Error));
  });

  it("should return userData with isNewUser=true if user does not exist", async () => {
    mockUsers.findOne.mockResolvedValueOnce(null);

    await makeGoogleVerify(mockUsers as any)("", "", baseProfile, done);

    expect(mockUsers.findOne).toHaveBeenCalledWith({
      email: "ada@example.com",
    });
    expect(done).toHaveBeenCalledWith(
      null,
      expect.objectContaining({
        email: "ada@example.com",
        name: "Ada Lovelace",
        googleId: "gid-123",
        isNewUser: true,
        role: "student", // default role when new
      })
    );
  });

  it("should return userData with isNewUser=false if user already exists", async () => {
    mockUsers.findOne.mockResolvedValueOnce({
      email: "ada@example.com",
      role: "Teacher",
    });

    await makeGoogleVerify(mockUsers as any)("", "", baseProfile, done);

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
    mockUsers.findOne.mockRejectedValueOnce(error);

    await makeGoogleVerify(mockUsers as any)("", "", baseProfile, done);

    expect(done).toHaveBeenCalledWith(error);
  });
});
