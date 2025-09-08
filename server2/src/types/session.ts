import "express-session";

declare module "express-session" {
  interface SessionData {
    email?: string;
    name?: string;
    role?: string;
    authAction?: "login" | "register";
  }
}
