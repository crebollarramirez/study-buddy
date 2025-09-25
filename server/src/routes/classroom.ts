import { Router, Request, Response } from "express";
import {
  ClassroomSummary,
  CreateClassroomInput,
  Database,
  DatabaseClassroom,
  DatabaseUser,
  UpdateClassroomInput,
} from "../database";
import { requireAuth, requireRole } from "../middleware";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ClassroomShape = "ids" | "full";

export function sanitizeStudentEmails(value: unknown): string[] | null {
  if (value == null) {
    return [];
  }

  if (!Array.isArray(value)) {
    return null;
  }

  const normalized = value
    .map((entry) => (typeof entry === "string" ? entry.trim() : null))
    .filter((entry): entry is string => Boolean(entry));

  return Array.from(new Set(normalized));
}

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value);
}

const summarizeClassroom = (classroom: ClassroomSummary) => ({
  classroomId: classroom.classroomId,
  className: classroom.className,
  subject: classroom.subject,
  teacher: classroom.teacher,
});

const formatClassroom = (classroom: DatabaseClassroom) => ({
  classroomId: classroom.classroomId,
  className: classroom.className,
  subject: classroom.subject,
  teacher: classroom.teacher,
  students: Array.from(classroom.students).sort(),
  assignments: Array.from(classroom.assignments).sort(),
});

const resolveShape = (
  requested: string | undefined,
  role: string
): ClassroomShape | null => {
  if (!requested) {
    return role === "teacher" ? "full" : "ids";
  }

  if (requested === "ids" || requested === "full") {
    return requested;
  }

  return null;
};

const ensureTeacherOwnership = (
  classroom: DatabaseClassroom | null,
  teacherEmail: string
) => {
  if (!classroom) {
    return { status: 404, body: { error: "Classroom not found" } } as const;
  }

  if (classroom.teacher !== teacherEmail) {
    return {
      status: 403,
      body: { error: "Insufficient permissions" },
    } as const;
  }

  return null;
};

const ensureStudentMembership = (
  classroom: DatabaseClassroom | null,
  studentEmail: string
) => {
  if (!classroom) {
    return { status: 404, body: { error: "Classroom not found" } } as const;
  }

  if (!classroom.students.has(studentEmail)) {
    return {
      status: 403,
      body: { error: "Insufficient permissions" },
    } as const;
  }

  return null;
};

const createClassroomRouter = (database: Database): Router => {
  const router = Router();

  router.use(requireAuth);

  router.get("/", async (req: Request, res: Response) => {
    const user = req.user as DatabaseUser;
    const classroomId = req.query.classroomId as string | undefined;
    const shape = resolveShape(req.query.shape as string | undefined, user.role);

    if (!shape) {
      return res.status(400).json({ error: "Invalid shape parameter" });
    }

    if (classroomId) {
      const classroom = await database.getClassroomById(classroomId);

      if (user.role === "teacher") {
        const error = ensureTeacherOwnership(classroom, user.email);
        if (error) {
          return res.status(error.status).json(error.body);
        }
      } else {
        const error = ensureStudentMembership(classroom, user.email);
        if (error) {
          return res.status(error.status).json(error.body);
        }
      }

      return res.json({ classroom: formatClassroom(classroom!) });
    }

    if (user.role === "teacher") {
      const summaries = await database.getClassroomSummariesByTeacher(
        user.email
      );

      if (shape === "ids") {
        return res.json({ classrooms: summaries.map((c) => c.classroomId) });
      }

      return res.json({
        classrooms: summaries.map(summarizeClassroom),
      });
    }

    const summaries = await database.getClassroomSummariesByStudent(
      user.email
    );

    if (shape === "ids") {
      return res.json({ classrooms: summaries.map((c) => c.classroomId) });
    }

    return res.json({ classrooms: summaries.map(summarizeClassroom) });
  });

  router.post(
    "/create",
    requireRole("teacher"),
    async (req: Request, res: Response) => {
      const user = req.user as DatabaseUser;
      const { className, subject } = req.body as CreateClassroomInput;
      const sanitized = sanitizeStudentEmails(req.body.students);

      if (!className || typeof className !== "string") {
        return res.status(400).json({ error: "className is required" });
      }

      if (!subject || typeof subject !== "string") {
        return res.status(400).json({ error: "subject is required" });
      }

      if (sanitized === null) {
        return res.status(400).json({ error: "students must be an array" });
      }

      const invalidEmail = sanitized.find((email) => !isValidEmail(email));
      if (invalidEmail) {
        return res.status(400).json({ error: "Invalid student email" });
      }

      const classroom = await database.createClassroom({
        className,
        subject,
        students: sanitized,
        teacher: user.email,
      });

      return res.status(201).json({ classroom: formatClassroom(classroom) });
    }
  );

  router.patch(
    "/update",
    requireRole("teacher"),
    async (req: Request, res: Response) => {
      const user = req.user as DatabaseUser;
      const { classroomId, className, subject } =
        req.body as UpdateClassroomInput;

      if (!classroomId || typeof classroomId !== "string") {
        return res.status(400).json({ error: "classroomId is required" });
      }

      if (className !== undefined && typeof className !== "string") {
        return res.status(400).json({ error: "className must be a string" });
      }

      if (subject !== undefined && typeof subject !== "string") {
        return res.status(400).json({ error: "subject must be a string" });
      }

      if (className === undefined && subject === undefined) {
        return res
          .status(400)
          .json({ error: "className or subject must be provided" });
      }

      const existing = await database.getClassroomById(classroomId);
      const ownershipError = ensureTeacherOwnership(existing, user.email);
      if (ownershipError) {
        return res.status(ownershipError.status).json(ownershipError.body);
      }

      const updated = await database.updateClassroom({
        classroomId,
        className,
        subject,
      });

      if (!updated) {
        return res.status(404).json({ error: "Classroom not found" });
      }

      return res.json({ classroom: formatClassroom(updated) });
    }
  );

  router.delete(
    "/:classroomId",
    requireRole("teacher"),
    async (req: Request, res: Response) => {
      const user = req.user as DatabaseUser;
      const { classroomId } = req.params;

      if (!classroomId) {
        return res.status(400).json({ error: "classroomId is required" });
      }

      const classroom = await database.getClassroomById(classroomId);
      const ownershipError = ensureTeacherOwnership(classroom, user.email);
      if (ownershipError) {
        return res.status(ownershipError.status).json(ownershipError.body);
      }

      const deleted = await database.deleteClassroom(classroomId);
      if (!deleted) {
        return res.status(404).json({ error: "Classroom not found" });
      }

      return res.status(204).send();
    }
  );

  return router;
};

export default createClassroomRouter;
