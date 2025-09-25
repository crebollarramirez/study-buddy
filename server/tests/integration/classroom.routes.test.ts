import express from "express";
import request from "supertest";
import createClassroomRouter from "@/routes/classroom";
import { DatabaseClassroom } from "@/database";

describe("classroom router", () => {
  const teacherEmail = "teacher@example.com";
  const studentEmail = "student@example.com";

  let app: express.Express;
  let database: {
    getClassroomSummariesByTeacher: jest.Mock;
    getClassroomSummariesByStudent: jest.Mock;
    getClassroomById: jest.Mock;
    createClassroom: jest.Mock;
    updateClassroom: jest.Mock;
    deleteClassroom: jest.Mock;
  };

  const baseClassroom = (): DatabaseClassroom => ({
    classroomId: "class-1",
    className: "Algebra",
    subject: "Math",
    teacher: teacherEmail,
    students: new Set([studentEmail]),
    assignments: new Set(["assign-1"]),
  });

  beforeEach(() => {
    database = {
      getClassroomSummariesByTeacher: jest.fn(),
      getClassroomSummariesByStudent: jest.fn(),
      getClassroomById: jest.fn(),
      createClassroom: jest.fn(),
      updateClassroom: jest.fn(),
      deleteClassroom: jest.fn(),
    };

    app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      const role = req.header("x-user-role");
      const email = req.header("x-user-email") ?? teacherEmail;
      (req as any).isAuthenticated = () => Boolean(role);
      if (role) {
        (req as any).user = { email, role };
      }
      next();
    });
    app.use("/classroom", createClassroomRouter(database as any));
  });

  it("returns full classroom summaries for teachers by default", async () => {
    database.getClassroomSummariesByTeacher.mockResolvedValue([
      {
        classroomId: "class-1",
        className: "Algebra",
        subject: "Math",
        teacher: teacherEmail,
      },
    ]);

    const response = await request(app)
      .get("/classroom")
      .set("x-user-role", "teacher")
      .set("x-user-email", teacherEmail);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      classrooms: [
        {
          classroomId: "class-1",
          className: "Algebra",
          subject: "Math",
          teacher: teacherEmail,
        },
      ],
    });
  });

  it("returns classroom ids when teachers request ids shape", async () => {
    database.getClassroomSummariesByTeacher.mockResolvedValue([
      {
        classroomId: "class-1",
        className: "Algebra",
        subject: "Math",
        teacher: teacherEmail,
      },
    ]);

    const response = await request(app)
      .get("/classroom")
      .query({ shape: "ids" })
      .set("x-user-role", "teacher")
      .set("x-user-email", teacherEmail);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ classrooms: ["class-1"] });
  });

  it("lists classrooms for students with ids by default", async () => {
    database.getClassroomSummariesByStudent.mockResolvedValue([
      {
        classroomId: "class-1",
        className: "Algebra",
        subject: "Math",
        teacher: teacherEmail,
      },
    ]);

    const response = await request(app)
      .get("/classroom")
      .set("x-user-role", "student")
      .set("x-user-email", studentEmail);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ classrooms: ["class-1"] });
  });

  it("returns full classroom summaries for students when requested", async () => {
    database.getClassroomSummariesByStudent.mockResolvedValue([
      {
        classroomId: "class-1",
        className: "Algebra",
        subject: "Math",
        teacher: teacherEmail,
      },
    ]);

    const response = await request(app)
      .get("/classroom")
      .query({ shape: "full" })
      .set("x-user-role", "student")
      .set("x-user-email", studentEmail);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      classrooms: [
        {
          classroomId: "class-1",
          className: "Algebra",
          subject: "Math",
          teacher: teacherEmail,
        },
      ],
    });
  });

  it("rejects invalid shape parameters", async () => {
    const response = await request(app)
      .get("/classroom")
      .query({ shape: "invalid" })
      .set("x-user-role", "teacher")
      .set("x-user-email", teacherEmail);

    expect(response.status).toBe(400);
  });

  it("returns detailed classroom data for teacher owners", async () => {
    const classroom = baseClassroom();
    database.getClassroomById.mockResolvedValue(classroom);

    const response = await request(app)
      .get("/classroom")
      .query({ classroomId: classroom.classroomId })
      .set("x-user-role", "teacher")
      .set("x-user-email", teacherEmail);

    expect(response.status).toBe(200);
    expect(response.body.classroom.students).toEqual([studentEmail]);
    expect(response.body.classroom.assignments).toEqual(["assign-1"]);
  });

  it("forbids teachers from accessing classrooms they do not own", async () => {
    const classroom = baseClassroom();
    classroom.teacher = "other@example.com";
    database.getClassroomById.mockResolvedValue(classroom);

    const response = await request(app)
      .get("/classroom")
      .query({ classroomId: classroom.classroomId })
      .set("x-user-role", "teacher")
      .set("x-user-email", teacherEmail);

    expect(response.status).toBe(403);
  });

  it("allows students to access classrooms they belong to", async () => {
    const classroom = baseClassroom();
    database.getClassroomById.mockResolvedValue(classroom);

    const response = await request(app)
      .get("/classroom")
      .query({ classroomId: classroom.classroomId })
      .set("x-user-role", "student")
      .set("x-user-email", studentEmail);

    expect(response.status).toBe(200);
  });

  it("forbids students who are not members", async () => {
    const classroom = baseClassroom();
    classroom.students = new Set(["someone@example.com"]);
    database.getClassroomById.mockResolvedValue(classroom);

    const response = await request(app)
      .get("/classroom")
      .query({ classroomId: classroom.classroomId })
      .set("x-user-role", "student")
      .set("x-user-email", studentEmail);

    expect(response.status).toBe(403);
  });

  it("validates student email format during creation", async () => {
    const response = await request(app)
      .post("/classroom/create")
      .set("x-user-role", "teacher")
      .set("x-user-email", teacherEmail)
      .send({
        className: "Algebra",
        subject: "Math",
        students: ["invalid-email"],
      });

    expect(response.status).toBe(400);
    expect(database.createClassroom).not.toHaveBeenCalled();
  });

  it("creates classrooms for teachers", async () => {
    const classroom = baseClassroom();
    database.createClassroom.mockResolvedValue(classroom);

    const response = await request(app)
      .post("/classroom/create")
      .set("x-user-role", "teacher")
      .set("x-user-email", teacherEmail)
      .send({
        className: "Algebra",
        subject: "Math",
        students: [studentEmail, studentEmail],
      });

    expect(response.status).toBe(201);
    expect(database.createClassroom).toHaveBeenCalledWith({
      className: "Algebra",
      subject: "Math",
      students: [studentEmail],
      teacher: teacherEmail,
    });
  });

  it("requires ownership for updates", async () => {
    const classroom = baseClassroom();
    classroom.teacher = "other@example.com";
    database.getClassroomById.mockResolvedValue(classroom);

    const response = await request(app)
      .patch("/classroom/update")
      .set("x-user-role", "teacher")
      .set("x-user-email", teacherEmail)
      .send({ classroomId: classroom.classroomId, className: "New" });

    expect(response.status).toBe(403);
    expect(database.updateClassroom).not.toHaveBeenCalled();
  });

  it("updates classroom metadata for owners", async () => {
    const classroom = baseClassroom();
    database.getClassroomById.mockResolvedValueOnce(classroom);
    database.updateClassroom.mockResolvedValue({
      ...classroom,
      className: "Updated",
    });

    const response = await request(app)
      .patch("/classroom/update")
      .set("x-user-role", "teacher")
      .set("x-user-email", teacherEmail)
      .send({ classroomId: classroom.classroomId, className: "Updated" });

    expect(response.status).toBe(200);
    expect(database.updateClassroom).toHaveBeenCalledWith({
      classroomId: classroom.classroomId,
      className: "Updated",
      subject: undefined,
    });
  });

  it("deletes classrooms for owners", async () => {
    const classroom = baseClassroom();
    database.getClassroomById.mockResolvedValue(classroom);
    database.deleteClassroom.mockResolvedValue(true);

    const response = await request(app)
      .delete(`/classroom/${classroom.classroomId}`)
      .set("x-user-role", "teacher")
      .set("x-user-email", teacherEmail);

    expect(response.status).toBe(204);
    expect(database.deleteClassroom).toHaveBeenCalledWith(classroom.classroomId);
  });
});
