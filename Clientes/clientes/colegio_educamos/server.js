const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3100;
const ROOT_DIR = __dirname;
const DATA_FILE = path.join(ROOT_DIR, "data", "store.json");
const UPLOAD_DIR = path.join(ROOT_DIR, "uploads");
const JWT_SECRET = process.env.JWT_SECRET || "educamos-demo-secret";
const POSTGRES_SCHEMA_FILE = path.join(ROOT_DIR, "data", "postgres-schema.sql");

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(UPLOAD_DIR));

const storage = multer.diskStorage({
  destination: (req, file, callback) => callback(null, UPLOAD_DIR),
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname);
    callback(null, `${Date.now()}-${crypto.randomUUID()}${extension}`);
  }
});
const upload = multer({ storage });

function readStore() {
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function writeStore(store) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || "",
    childrenIds: user.childrenIds || []
  };
}

function issueToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: "12h" }
  );
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [, token] = authHeader.split(" ");
  if (!token) {
    return res.status(401).json({ error: "Token requerido" });
  }

  try {
    req.auth = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

function requireStoreUser(store, tokenPayload) {
  const user = store.users.find((item) => item.id === tokenPayload.sub);
  if (!user) {
    const error = new Error("Usuario no encontrado");
    error.status = 404;
    throw error;
  }
  return user;
}

function requireRole(user, roles) {
  if (!roles.includes(user.role)) {
    const error = new Error("No autorizado para esta acción");
    error.status = 403;
    throw error;
  }
}

function ensureRecord(list, predicate, message) {
  const record = list.find(predicate);
  if (!record) {
    const error = new Error(message);
    error.status = 404;
    throw error;
  }
  return record;
}

function makeJitsiUrl(courseTitle, topic) {
  const slug = `${courseTitle}-${topic}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `https://meet.jit.si/Educamos-${slug || crypto.randomUUID()}`;
}

function toJitsiEmbed(url = "") {
  if (!url.includes("meet.jit.si")) return null;
  const room = url.split("/").pop();
  return `https://meet.jit.si/${room}#config.prejoinPageEnabled=false&config.startWithAudioMuted=true&config.startWithVideoMuted=true`;
}

function latestByDate(records, selector) {
  return [...records].sort((a, b) => (selector(a) < selector(b) ? 1 : -1));
}

function buildDashboard(store, user) {
  const announcements = latestByDate(store.announcements, (item) => item.createdAt);
  const messages = latestByDate(store.messages, (item) => item.createdAt);
  const now = new Date().toISOString();

  if (user.role === "admin") {
    const teachers = store.users.filter((item) => item.role === "teacher");
    const students = store.users.filter((item) => item.role === "student");
    const parents = store.users.filter((item) => item.role === "parent");
    return {
      role: "admin",
      user: sanitizeUser(user),
      metrics: {
        users: store.users.length,
        teachers: teachers.length,
        students: students.length,
        parents: parents.length,
        courses: store.courses.length,
        classes: store.classes.length,
        assignments: store.assignments.length
      },
      users: store.users.map(sanitizeUser),
      courses: store.courses.map((course) => ({
        ...course,
        teacher: sanitizeUser(store.users.find((item) => item.id === course.teacherId) || { id: "", name: "Sin profesor", email: "", role: "teacher" }),
        studentCount: store.enrollments.filter((item) => item.courseId === course.id).length
      })),
      announcements,
      recentMessages: messages.slice(0, 8),
      databaseMode: process.env.DATABASE_URL ? "postgres-ready" : "json-demo",
      generatedAt: now
    };
  }

  if (user.role === "teacher") {
    const teacherCourses = store.courses.filter((course) => course.teacherId === user.id);
    const courseIds = teacherCourses.map((course) => course.id);
    return {
      role: "teacher",
      user: sanitizeUser(user),
      courses: teacherCourses.map((course) => ({
        ...course,
        students: store.enrollments
          .filter((item) => item.courseId === course.id)
          .map((item) => sanitizeUser(store.users.find((record) => record.id === item.studentId)))
          .filter(Boolean),
        classes: store.classes
          .filter((item) => item.courseId === course.id)
          .map((session) => ({ ...session, meetingEmbedUrl: toJitsiEmbed(session.meetingUrl) })),
        assignments: store.assignments.filter((item) => item.courseId === course.id)
      })),
      submissions: store.submissions.filter((item) => courseIds.includes(item.courseId)),
      grades: store.grades.filter((item) => courseIds.includes(item.courseId)),
      attendance: store.attendance.filter((item) => courseIds.includes(item.courseId)),
      announcements,
      generatedAt: now
    };
  }

  if (user.role === "student") {
    const enrollments = store.enrollments.filter((item) => item.studentId === user.id);
    const courseIds = enrollments.map((item) => item.courseId);
    const courses = store.courses
      .filter((course) => courseIds.includes(course.id))
      .map((course) => ({
        ...course,
        teacher: sanitizeUser(store.users.find((item) => item.id === course.teacherId) || { id: "", name: "Sin profesor", email: "", role: "teacher" }),
        classes: store.classes
          .filter((item) => item.courseId === course.id)
          .map((session) => ({ ...session, meetingEmbedUrl: toJitsiEmbed(session.meetingUrl) })),
        assignments: store.assignments.filter((item) => item.courseId === course.id),
        grades: store.grades.filter((item) => item.courseId === course.id && item.studentId === user.id),
        attendance: store.attendance.filter((item) => item.courseId === course.id && item.studentId === user.id),
        submissions: store.submissions.filter((item) => item.courseId === course.id && item.studentId === user.id)
      }));

    const nextClasses = courses
      .flatMap((course) =>
        course.classes.map((session) => ({
          ...session,
          courseTitle: course.title
        }))
      )
      .sort((a, b) => (a.startAt > b.startAt ? 1 : -1))
      .slice(0, 6);

    return {
      role: "student",
      user: sanitizeUser(user),
      courses,
      nextClasses,
      announcements,
      messages: messages.filter((item) => item.toUserId === user.id || item.fromUserId === user.id),
      generatedAt: now
    };
  }

  if (user.role === "parent") {
    const children = store.users.filter((item) => (user.childrenIds || []).includes(item.id));
    return {
      role: "parent",
      user: sanitizeUser(user),
      children: children.map((child) => {
        const courseIds = store.enrollments.filter((item) => item.studentId === child.id).map((item) => item.courseId);
        return {
          ...sanitizeUser(child),
          courses: store.courses
            .filter((course) => courseIds.includes(course.id))
            .map((course) => ({
              ...course,
              teacher: sanitizeUser(store.users.find((item) => item.id === course.teacherId) || { id: "", name: "Sin profesor", email: "", role: "teacher" }),
              grades: store.grades.filter((item) => item.courseId === course.id && item.studentId === child.id),
              attendance: store.attendance.filter((item) => item.courseId === course.id && item.studentId === child.id),
              assignments: store.assignments.filter((item) => item.courseId === course.id),
              classes: store.classes
                .filter((item) => item.courseId === course.id)
                .map((session) => ({ ...session, meetingEmbedUrl: toJitsiEmbed(session.meetingUrl) }))
            }))
        };
      }),
      announcements,
      messages: messages.filter((item) => item.toUserId === user.id || item.fromUserId === user.id),
      generatedAt: now
    };
  }

  return { role: user.role, user: sanitizeUser(user), generatedAt: now };
}

app.get("/api/meta/credentials", (req, res) => {
  const store = readStore();
  res.json(
    store.users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role
    }))
  );
});

app.get("/api/meta/database", (req, res) => {
  res.json({
    mode: process.env.DATABASE_URL ? "postgres-ready" : "json-demo",
    schemaAvailable: fs.existsSync(POSTGRES_SCHEMA_FILE)
  });
});

app.post("/api/auth/login", (req, res, next) => {
  try {
    const { email, password } = req.body;
    const store = readStore();
    const user = store.users.find((item) => item.email === email && item.password === password);
    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    res.json({
      token: issueToken(user),
      user: sanitizeUser(user)
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/auth/session", authMiddleware, (req, res, next) => {
  try {
    const store = readStore();
    const user = requireStoreUser(store, req.auth);
    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/dashboard", authMiddleware, (req, res, next) => {
  try {
    const store = readStore();
    const user = requireStoreUser(store, req.auth);
    res.json(buildDashboard(store, user));
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/users", authMiddleware, (req, res, next) => {
  try {
    const store = readStore();
    const actor = requireStoreUser(store, req.auth);
    requireRole(actor, ["admin"]);

    const newUser = {
      id: crypto.randomUUID(),
      name: req.body.name,
      email: req.body.email,
      password: req.body.password || "demo123",
      role: req.body.role,
      phone: req.body.phone || "",
      childrenIds: req.body.childrenIds || []
    };
    store.users.push(newUser);
    writeStore(store);
    res.status(201).json(sanitizeUser(newUser));
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/courses", authMiddleware, (req, res, next) => {
  try {
    const store = readStore();
    const actor = requireStoreUser(store, req.auth);
    requireRole(actor, ["admin"]);
    const teacher = ensureRecord(store.users, (item) => item.id === req.body.teacherId && item.role === "teacher", "Profesor no encontrado");

    const course = {
      id: crypto.randomUUID(),
      title: req.body.title,
      cycle: req.body.cycle,
      description: req.body.description,
      teacherId: teacher.id
    };
    store.courses.push(course);
    writeStore(store);
    res.status(201).json(course);
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/announcements", authMiddleware, (req, res, next) => {
  try {
    const store = readStore();
    const actor = requireStoreUser(store, req.auth);
    requireRole(actor, ["admin"]);

    const announcement = {
      id: crypto.randomUUID(),
      title: req.body.title,
      body: req.body.body,
      audience: req.body.audience || "all",
      createdAt: new Date().toISOString(),
      createdBy: actor.id
    };
    store.announcements.unshift(announcement);
    writeStore(store);
    res.status(201).json(announcement);
  } catch (error) {
    next(error);
  }
});

app.post("/api/teacher/classes", authMiddleware, (req, res, next) => {
  try {
    const store = readStore();
    const actor = requireStoreUser(store, req.auth);
    requireRole(actor, ["teacher", "admin"]);
    const course = ensureRecord(store.courses, (item) => item.id === req.body.courseId, "Curso no encontrado");
    if (actor.role === "teacher" && course.teacherId !== actor.id) {
      const error = new Error("No puedes programar clases para un curso que no te pertenece");
      error.status = 403;
      throw error;
    }

    const meetingUrl = req.body.meetingUrl || makeJitsiUrl(course.title, req.body.topic || req.body.title || "clase");
    const session = {
      id: crypto.randomUUID(),
      courseId: course.id,
      title: req.body.title,
      topic: req.body.topic,
      startAt: req.body.startAt,
      meetingUrl,
      recordingUrl: req.body.recordingUrl || "",
      aiSummary: req.body.aiSummary || ""
    };
    store.classes.push(session);
    writeStore(store);
    res.status(201).json({ ...session, meetingEmbedUrl: toJitsiEmbed(session.meetingUrl) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/teacher/assignments", authMiddleware, (req, res, next) => {
  try {
    const store = readStore();
    const actor = requireStoreUser(store, req.auth);
    requireRole(actor, ["teacher", "admin"]);
    const course = ensureRecord(store.courses, (item) => item.id === req.body.courseId, "Curso no encontrado");
    if (actor.role === "teacher" && course.teacherId !== actor.id) {
      const error = new Error("No puedes crear tareas en un curso que no te pertenece");
      error.status = 403;
      throw error;
    }

    const assignment = {
      id: crypto.randomUUID(),
      courseId: course.id,
      title: req.body.title,
      description: req.body.description,
      dueAt: req.body.dueAt,
      points: Number(req.body.points || 100)
    };
    store.assignments.push(assignment);
    writeStore(store);
    res.status(201).json(assignment);
  } catch (error) {
    next(error);
  }
});

app.post("/api/teacher/grades", authMiddleware, (req, res, next) => {
  try {
    const store = readStore();
    const actor = requireStoreUser(store, req.auth);
    requireRole(actor, ["teacher", "admin"]);
    const course = ensureRecord(store.courses, (item) => item.id === req.body.courseId, "Curso no encontrado");
    if (actor.role === "teacher" && course.teacherId !== actor.id) {
      const error = new Error("No puedes calificar en un curso que no te pertenece");
      error.status = 403;
      throw error;
    }

    const record = {
      id: crypto.randomUUID(),
      courseId: course.id,
      studentId: req.body.studentId,
      label: req.body.label,
      value: Number(req.body.value),
      maxValue: Number(req.body.maxValue || 5),
      feedback: req.body.feedback || ""
    };
    store.grades.push(record);
    writeStore(store);
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
});

app.post("/api/teacher/attendance", authMiddleware, (req, res, next) => {
  try {
    const store = readStore();
    const actor = requireStoreUser(store, req.auth);
    requireRole(actor, ["teacher", "admin"]);
    const course = ensureRecord(store.courses, (item) => item.id === req.body.courseId, "Curso no encontrado");
    if (actor.role === "teacher" && course.teacherId !== actor.id) {
      const error = new Error("No puedes registrar asistencia en un curso que no te pertenece");
      error.status = 403;
      throw error;
    }

    const attendance = {
      id: crypto.randomUUID(),
      courseId: course.id,
      studentId: req.body.studentId,
      status: req.body.status,
      date: req.body.date
    };
    store.attendance.push(attendance);
    writeStore(store);
    res.status(201).json(attendance);
  } catch (error) {
    next(error);
  }
});

app.post("/api/student/submissions", authMiddleware, (req, res, next) => {
  try {
    const store = readStore();
    const actor = requireStoreUser(store, req.auth);
    requireRole(actor, ["student"]);
    const assignment = ensureRecord(store.assignments, (item) => item.id === req.body.assignmentId, "Tarea no encontrada");

    let submission = store.submissions.find((item) => item.assignmentId === assignment.id && item.studentId === actor.id);
    if (!submission) {
      submission = {
        id: crypto.randomUUID(),
        assignmentId: assignment.id,
        courseId: assignment.courseId,
        studentId: actor.id,
        url: req.body.url || "",
        fileUrl: req.body.fileUrl || "",
        fileName: req.body.fileName || "",
        comment: req.body.comment || "",
        submittedAt: new Date().toISOString()
      };
      store.submissions.push(submission);
    } else {
      submission.url = req.body.url || submission.url;
      submission.fileUrl = req.body.fileUrl || submission.fileUrl;
      submission.fileName = req.body.fileName || submission.fileName;
      submission.comment = req.body.comment || submission.comment;
      submission.submittedAt = new Date().toISOString();
    }

    writeStore(store);
    res.status(201).json(submission);
  } catch (error) {
    next(error);
  }
});

app.post("/api/student/submissions/upload", authMiddleware, upload.single("file"), (req, res, next) => {
  try {
    const store = readStore();
    const actor = requireStoreUser(store, req.auth);
    requireRole(actor, ["student"]);
    const assignment = ensureRecord(store.assignments, (item) => item.id === req.body.assignmentId, "Tarea no encontrada");
    if (!req.file) {
      return res.status(400).json({ error: "Archivo requerido" });
    }

    let submission = store.submissions.find((item) => item.assignmentId === assignment.id && item.studentId === actor.id);
    const publicUrl = `/uploads/${req.file.filename}`;
    if (!submission) {
      submission = {
        id: crypto.randomUUID(),
        assignmentId: assignment.id,
        courseId: assignment.courseId,
        studentId: actor.id,
        url: "",
        fileUrl: publicUrl,
        fileName: req.file.originalname,
        comment: req.body.comment || "",
        submittedAt: new Date().toISOString()
      };
      store.submissions.push(submission);
    } else {
      submission.fileUrl = publicUrl;
      submission.fileName = req.file.originalname;
      submission.comment = req.body.comment || submission.comment;
      submission.submittedAt = new Date().toISOString();
    }

    writeStore(store);
    res.status(201).json(submission);
  } catch (error) {
    next(error);
  }
});

app.post("/api/messages", authMiddleware, (req, res, next) => {
  try {
    const store = readStore();
    const actor = requireStoreUser(store, req.auth);
    const receiver = ensureRecord(store.users, (item) => item.id === req.body.toUserId, "Destinatario no encontrado");

    const message = {
      id: crypto.randomUUID(),
      fromUserId: actor.id,
      toUserId: receiver.id,
      body: req.body.body,
      createdAt: new Date().toISOString()
    };
    store.messages.push(message);
    writeStore(store);
    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
});

app.use(express.static(ROOT_DIR));

app.get("/platform", (req, res) => {
  res.sendFile(path.join(ROOT_DIR, "platform.html"));
});

app.use((error, req, res, next) => {
  const status = error.status || 500;
  res.status(status).json({ error: error.message || "Error interno del servidor" });
});

app.listen(PORT, () => {
  const mode = process.env.DATABASE_URL ? "postgres-ready" : "json-demo";
  console.log(`Colegio Educamos listo en http://localhost:${PORT} (${mode})`);
});
