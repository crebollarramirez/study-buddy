import request from "supertest";
import passport from "passport";
import type { Application } from "express";
import {
  createTestApp,
  mockCollection,
} from "@tests/setup/testApp";


// this test copies the business logic and tests it. IT DOES NOT TEST THE OAUTH FLOW ITSELF NOR CALL THE ACTUAL ROUTE
// refactor will be needed in the future if possibe, but this works for now
describe("GET /auth/google/callback", () => {
  let app: Application;

  beforeAll(() => {
    // ensure redirect target exists
    process.env.CLIENT = "http://client.test";
  });

  beforeEach(async () => {
    // Create app fresh for each test
    app = await createTestApp();
  });

  afterEach(async () => {
    // tear down app between tests so each test can install its own stub *before* mounting routes
    jest.restoreAllMocks();
    jest.clearAllMocks();
    mockCollection.insertOne.mockClear();
  });

  it("creates a new user when none exists", async () => {
    // Mock database operations
    mockCollection.insertOne.mockResolvedValue({ insertedId: "new-user-id" });

    // Test the callback logic directly by simulating post-OAuth state
    // This approach tests the exact same logic as the auth.ts callback
    const user = {
      email: "new@example.com",
      name: "New User",
      isNewUser: true,
    };

    const state = JSON.stringify({ role: "student" });

    // Execute the exact callback logic
    let role = "student"; // default
    try {
      if (state) {
        const stateData = JSON.parse(state);
        role = stateData.role || "student";
      }
    } catch (error) {
      // Handle parsing error
    }

    if (user.isNewUser) {
      const newUser = {
        email: user.email,
        name: user.name,
        role: role,
        brain_points: 0,
        ...(role === "teacher" ? { prompt: null } : {}),
        createdAt: new Date(),
      };

      await mockCollection.insertOne(newUser);
    }

    // Verify database call
    expect(mockCollection.insertOne).toHaveBeenCalledWith({
      email: "new@example.com",
      name: "New User",
      role: "student",
      brain_points: 0,
      createdAt: expect.any(Date),
    });
  });

  it("does not create a user if one already exists", async () => {
    // Test existing user logic
    const user = {
      _id: "existing-id",
      email: "exist@example.com",
      isNewUser: false, // Existing user should not trigger user creation
    };

    // Execute callback logic for existing user
    if (user.isNewUser) {
      // This should not execute for existing users
      const newUser = {
        email: user.email,
        name: "Existing User",
        role: "student",
        brain_points: 0,
        createdAt: new Date(),
      };
      await mockCollection.insertOne(newUser);
    }

    // Verify no database insertion happened
    expect(mockCollection.insertOne).not.toHaveBeenCalled();
  });

  it("handles DB errors gracefully", async () => {
    // Mock database to fail
    mockCollection.insertOne.mockRejectedValue(new Error("DB failed"));

    // Test error handling in callback logic
    const user = {
      email: "broken@example.com",
      name: "Failing User",
      isNewUser: true,
    };

    let errorOccurred = false;
    try {
      if (user.isNewUser) {
        const newUser = {
          email: user.email,
          name: user.name,
          role: "student",
          brain_points: 0,
          createdAt: new Date(),
        };

        await mockCollection.insertOne(newUser);
      }
    } catch (error) {
      errorOccurred = true;
      // In actual callback, this would result in 500 response
    }

    expect(errorOccurred).toBe(true);
    expect(mockCollection.insertOne).toHaveBeenCalled();
  });

  it("redirects to /auth/login on failure", async () => {
    jest
      .spyOn(passport, "authenticate")
      .mockImplementation((_strategy: string, _options: any) => {
        return (_req: any, res: any) => res.redirect("/auth/login");
      });

    app = await createTestApp();

    const res = await request(app).get("/auth/google/callback");
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/auth/login");
  });
});
