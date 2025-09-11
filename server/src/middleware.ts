import { Request, Response, NextFunction } from "express";

/**
 * Middleware that ensures the request is authenticated.
 *
 * If the user is not authenticated the middleware responds with 401 and a
 * JSON error. Otherwise it calls `next()` to continue the request pipeline.
 *
 * Usage:
 *   app.get('/protected', requireAuth, handler)
 */
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

/**
 * Factory that returns role-based authorization middleware.
 *
 * The returned middleware checks that the request is authenticated and that
 * `req.user.role` strictly equals the required `role` argument. If the user
 * is not authenticated a 401 is returned; if the user lacks the required
 * role a 403 is returned.
 *
 * Example:
 *   app.get('/teacher-only', requireRole('teacher'), handler)
 *
 * @param role - required role string (e.g. 'student' | 'teacher')
 */
export const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const user = req.user as any;
    if (user.role !== role) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
};
