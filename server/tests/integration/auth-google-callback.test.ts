import request from "supertest";
import passport from "passport";
import type { Application } from "express";
import {
  createTestApp,
  closeTestApp,     
  mockCollection,
} from "@tests/setup/testApp";

describe("GET /auth/google/callback", () => {
  let app: Application;

  beforeAll(() => {
    // ensure redirect target exists
    process.env.CLIENT = "http://client.test";
  });

  afterEach(async () => {
    // tear down app between tests so each test can install its own stub *before* mounting routes
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it("creates a new user when none exists", async () => {
    // 1) Stub passport BEFORE app creation so route binds to this middleware
    jest
      .spyOn(passport, "authenticate")
      .mockImplementation(() => (req: any, _res: any, next: any) => {
        // simulate successful Google auth + any session hints you rely on
        req.user = { email: "new@example.com", name: "New User" };
        req.session.authAction = "register";
        req.session.role = "student";
        return next();
      });

    // 2) Now create app (routes will use the stub above)
    app = await createTestApp();

    // 3) Spy on the SAME mock collection your app/router uses
    const insertSpy = jest
      .spyOn(mockCollection, "insertOne")
      .mockResolvedValue({ insertedId: "new-user-id" } as any);

    const res = await request(app).get("/auth/google/callback");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(process.env.CLIENT);
    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "new@example.com",
        role: "student",
        brain_points: 0,
      })
    );
  });

  it("does not create a user if one already exists", async () => {
    jest
      .spyOn(passport, "authenticate")
      .mockImplementation(() => (req: any, _res: any, next: any) => {
        req.user = { _id: "existing-id", email: "exist@example.com" };
        return next();
      });

    app = await createTestApp();

    const insertSpy = jest.spyOn(mockCollection, "insertOne");

    const res = await request(app).get("/auth/google/callback");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(process.env.CLIENT);
    expect(insertSpy).not.toHaveBeenCalled();
  });

  it("handles DB errors gracefully", async () => {
    jest
      .spyOn(passport, "authenticate")
      .mockImplementation(() => (req: any, _res: any, next: any) => {
        req.user = { email: "broken@example.com", name: "Failing User" };
        return next();
      });

    app = await createTestApp();

    jest
      .spyOn(mockCollection, "insertOne")
      .mockRejectedValue(new Error("DB failed"));

    const res = await request(app).get("/auth/google/callback");

    expect(res.status).toBe(500);
    expect(res.text).toContain("Authentication error");
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
