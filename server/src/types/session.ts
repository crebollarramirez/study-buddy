import "express-session";

declare module "express-session" {
  interface SessionData {
    email: string;
    fullName: string;
    role: string;
  }
}
