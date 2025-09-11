import request from "supertest";
import { createTestApp, closeTestApp, mockCollection } from "@tests/setup/testApp";
import type { Application } from "express";

describe("Authentication Routes", () => {
  let app: Application;

  // Wait for async startup before running tests
  beforeAll(async () => {
    app = await createTestApp();
    process.env.CLIENT = "http://client.test";
  });

  // Clean up after all tests to avoid "Jest did not exit" warning
  afterAll(async () => {
    await closeTestApp();
  });

  describe("GET /auth/isAuthenticated", () => {
    it("should return authentication status as false for unauthenticated user", async () => {
      const response = await request(app)
        .get("/auth/isAuthenticated")
        .expect(200);

      expect(response.body).toEqual({
        authenticated: false,
        account_type: null,
      });
    });

    it("should return proper content type", async () => {
      const response = await request(app)
        .get("/auth/isAuthenticated")
        .expect("Content-Type", /json/);

      expect(response.status).toBe(200);
    });
  });

  describe("GET /auth/login", () => {
    it("should redirect to Google OAuth", async () => {
      const response = await request(app).get("/auth/login").expect(302); // Expect redirect

      // Should redirect to /auth/google
      expect(response.headers.location).toBe("google");
    });
  });

  describe("GET /auth/register", () => {
    it("should redirect to Google OAuth with default student role", async () => {
      const response = await request(app).get("/auth/register").expect(302); // Expect redirect

      // Should redirect to /auth/google
      expect(response.headers.location).toBe("google");
    });

    it("should accept role parameter for teacher registration", async () => {
      const response = await request(app)
        .get("/auth/register?role=teacher")
        .expect(302); // Expect redirect

      // Should redirect to /auth/google
      expect(response.headers.location).toBe("google");
    });
  });

  describe("GET /auth/logout", () => {
    it("should handle logout request", async () => {
      const response = await request(app).get("/auth/logout");

      // Should either redirect or return success (depending on session state)
      expect([200, 302]).toContain(response.status);
    });
  });
});
