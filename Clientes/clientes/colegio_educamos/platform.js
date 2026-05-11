const state = {
  credentials: [],
  session: null,
  token: localStorage.getItem("educamos_token") || "",
  dashboard: null,
  activeSection: "overview"
};

const roleLabels = {
  admin: "Administrador",
  teacher: "Profesor",
  student: "Estudiante",
  parent: "Padre / Madre"
};

const loginSection = document.getElementById("loginSection");
const appLayout = document.getElementById("appLayout");
const credentialsGrid = document.getElementById("credentialsGrid");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const reloadDashboard = document.getElementById("reloadDashboard");
const logoutButton = document.getElementById("logoutButton");
const currentRoleBadge = document.getElementById("currentRoleBadge");
const sidebarNav = document.getElementById("sidebarNav");
const sidebarTitle = document.getElementById("sidebarTitle");
const sidebarSubtitle = document.getElementById("sidebarSubtitle");
const heroEyebrow = document.getElementById("heroEyebrow");
const heroTitle = document.getElementById("heroTitle");
const heroDescription = document.getElementById("heroDescription");
const statsGrid = document.getElementById("statsGrid");
const primaryGrid = document.getElementById("primaryGrid");
const secondaryGrid = document.getElementById("secondaryGrid");

const sectionsByRole = {
  admin: [
    { key: "overview", label: "Resumen" },
    { key: "users", label: "Usuarios" },
    { key: "courses", label: "Cursos" },
    { key: "announcements", label: "Anuncios" }
  ],
  teacher: [
    { key: "overview", label: "Resumen" },
    { key: "classes", label: "Clases" },
    { key: "assignments", label: "Tareas" },
    { key: "grading", label: "Notas y asistencia" }
  ],
  student: [
    { key: "overview", label: "Resumen" },
    { key: "courses", label: "Mis cursos" },
    { key: "assignments", label: "Entregas" },
    { key: "messages", label: "Mensajes" }
  ],
  parent: [
    { key: "overview", label: "Resumen" },
    { key: "children", label: "Hijos" },
    { key: "alerts", label: "Alertas" },
    { key: "messages", label: "Mensajes" }
  ]
};

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function card(title, body) {
  return `<article class="data-card"><h3>${escapeHtml(title)}</h3>${body}</article>`;
}

function list(items, emptyMessage = "Sin datos por ahora.") {
  if (!items.length) {
    return `<div class="empty">${escapeHtml(emptyMessage)}</div>`;
  }
  return `<div class="list">${items.join("")}</div>`;
}

function listRow(leftHtml, rightHtml = "") {
  return `<div class="list-row"><div>${leftHtml}</div><div>${rightHtml}</div></div>`;
}

function stat(label, value, tone = "info") {
  return `<article class="stat-card"><span class="badge ${tone}">${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></article>`;
}

function createInputField(name, label, type = "text", placeholder = "") {
  return `
    <div class="field">
      <label for="${escapeHtml(name)}">${escapeHtml(label)}</label>
      <input id="${escapeHtml(name)}" name="${escapeHtml(name)}" type="${escapeHtml(type)}" placeholder="${escapeHtml(placeholder)}" ${type !== "datetime-local" && type !== "date" ? "required" : ""} />
    </div>
  `;
}

function getHeaders(extraHeaders = {}, body) {
  const headers = { ...extraHeaders };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  if (!(body instanceof FormData)) headers["Content-Type"] = "application/json";
  return headers;
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: getHeaders(options.headers || {}, options.body)
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: "Error inesperado" }));
    if (response.status === 401 && state.token) {
      logout();
    }
    throw new Error(payload.error || "Error inesperado");
  }

  return response.json();
}

function persistSession(token, user) {
  state.token = token;
  state.session = user;
  localStorage.setItem("educamos_token", token);
}

function logout() {
  state.token = "";
  state.session = null;
  state.dashboard = null;
  localStorage.removeItem("educamos_token");
  renderApp();
}

function getRecipientOptions(roles) {
  return state.credentials
    .filter((item) => roles.includes(item.role))
    .map((item) => `<option value="${item.id}">${escapeHtml(item.name)} · ${escapeHtml(roleLabels[item.role])}</option>`)
    .join("");
}

function renderCredentials() {
  credentialsGrid.innerHTML = state.credentials
    .map(
      (item) => `
        <article class="credential-card">
          <h3>${escapeHtml(roleLabels[item.role])}</h3>
          <p><strong>${escapeHtml(item.name)}</strong></p>
          <p>${escapeHtml(item.email)}</p>
          <p>Clave: <strong>${escapeHtml(item.password)}</strong></p>
          <p class="muted">Haz clic para usar esta cuenta.</p>
        </article>
      `
    )
    .join("");

  [...credentialsGrid.children].forEach((node, index) => {
    node.addEventListener("click", () => {
      document.getElementById("email").value = state.credentials[index].email;
      document.getElementById("password").value = state.credentials[index].password;
    });
  });
}

async function loadCredentials() {
  state.credentials = await api("/api/meta/credentials", { headers: {} });
  renderCredentials();
}

async function login(email, password) {
  const payload = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
  persistSession(payload.token, payload.user);
  await loadDashboard();
}

async function restoreSession() {
  if (!state.token) return;
  try {
    const payload = await api("/api/auth/session");
    state.session = payload.user;
    await loadDashboard(false);
  } catch (error) {
    logout();
  }
}

async function loadDashboard(resetSection = true) {
  state.dashboard = await api("/api/dashboard");
  if (resetSection) state.activeSection = "overview";
  renderApp();
}

function getActiveSections() {
  if (!state.session) return [];
  return sectionsByRole[state.session.role] || [];
}

function renderSidebar() {
  const sections = getActiveSections();
  sidebarTitle.textContent = roleLabels[state.session.role];
  sidebarSubtitle.textContent = `Trabajando como ${roleLabels[state.session.role].toLowerCase()}`;
  sidebarNav.innerHTML = sections
    .map(
      (section) => `
        <button class="nav-link ${state.activeSection === section.key ? "active" : ""}" data-section="${section.key}" type="button">
          ${escapeHtml(section.label)}
        </button>
      `
    )
    .join("");

  sidebarNav.querySelectorAll("[data-section]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeSection = button.dataset.section;
      renderApp();
    });
  });
}

function renderTeacherOverview(dashboard, teacherCourses) {
  return [
    [
      card(
        "Tus cursos",
        list(
          teacherCourses.map((course) =>
            listRow(
              `<strong>${escapeHtml(course.title)}</strong><p class="muted">${course.students.length} estudiantes · ${escapeHtml(course.cycle)}</p>`,
              `<span class="badge info">${course.classes.length} clases</span>`
            )
          )
        )
      ),
      card(
        "Anuncios institucionales",
        list(
          dashboard.announcements.map((announcement) =>
            listRow(
              `<strong>${escapeHtml(announcement.title)}</strong><p class="muted">${escapeHtml(announcement.body)}</p>`,
              `<span class="badge warn">${new Date(announcement.createdAt).toLocaleDateString("es-CO")}</span>`
            )
          )
        )
      )
    ].join(""),
    card(
      "Entregas recientes",
      list(
        dashboard.submissions.map((submission) =>
          listRow(
            `<strong>${escapeHtml(submission.fileName || submission.comment || "Entrega registrada")}</strong><p class="muted">${escapeHtml(submission.fileUrl || submission.url || "Sin archivo")}</p>`,
            `<span class="badge good">${escapeHtml(submission.studentId)}</span>`
          )
        ),
        "Todavia no hay entregas."
      )
    )
  ];
}

function renderAdmin() {
  const dashboard = state.dashboard;
  const section = state.activeSection;

  if (section === "overview") {
    heroEyebrow.textContent = "Administrador";
    heroTitle.textContent = "Control total de la plataforma";
    heroDescription.textContent = `Modo de datos: ${dashboard.databaseMode}. Gestiona usuarios, cursos y anuncios desde un solo lugar.`;
    statsGrid.innerHTML = [
      stat("Usuarios", dashboard.metrics.users),
      stat("Profesores", dashboard.metrics.teachers),
      stat("Estudiantes", dashboard.metrics.students),
      stat("Cursos", dashboard.metrics.courses)
    ].join("");
    primaryGrid.innerHTML = [
      card(
        "Cursos activos",
        list(
          dashboard.courses.map((course) =>
            listRow(
              `<strong>${escapeHtml(course.title)}</strong><p class="muted">${escapeHtml(course.cycle)} · ${escapeHtml(course.teacher?.name || "Sin profesor")}</p>`,
              `<span class="badge info">${course.studentCount} estudiantes</span>`
            )
          )
        )
      ),
      card(
        "Mensajes recientes",
        list(
          dashboard.recentMessages.map((message) =>
            listRow(
              `<strong>${escapeHtml(message.body)}</strong><p class="muted">${escapeHtml(message.fromUserId)} → ${escapeHtml(message.toUserId)}</p>`,
              `<span class="badge good">${new Date(message.createdAt).toLocaleDateString("es-CO")}</span>`
            )
          ),
          "No hay mensajes recientes."
        )
      )
    ].join("");
    secondaryGrid.innerHTML = card(
      "Anuncios",
      list(
        dashboard.announcements.map((announcement) =>
          listRow(
            `<strong>${escapeHtml(announcement.title)}</strong><p class="muted">${escapeHtml(announcement.body)}</p>`,
            `<span class="badge warn">${escapeHtml(announcement.audience)}</span>`
          )
        )
      )
    );
    return;
  }

  if (section === "users") {
    heroEyebrow.textContent = "Administrador";
    heroTitle.textContent = "Gestion de usuarios";
    heroDescription.textContent = "Crea administradores, profesores, estudiantes y padres.";
    statsGrid.innerHTML = "";
    primaryGrid.innerHTML = card(
      "Crear usuario",
      `
        <form class="form-grid" id="adminUserForm">
          ${createInputField("name", "Nombre completo", "text", "Nuevo usuario")}
          ${createInputField("email", "Correo", "email", "nuevo@educamos.demo")}
          ${createInputField("password", "Contrasena", "text", "demo123")}
          <div class="field">
            <label for="role">Rol</label>
            <select id="role" name="role">
              <option value="teacher">Profesor</option>
              <option value="student">Estudiante</option>
              <option value="parent">Padre / Madre</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div class="field" style="grid-column:1/-1;">
            <button class="btn btn-primary" type="submit">Crear usuario</button>
          </div>
        </form>
        <p class="status-note" id="adminUserMessage">Los nuevos usuarios quedan disponibles de inmediato para iniciar sesion.</p>
      `
    );
    secondaryGrid.innerHTML = card(
      "Usuarios existentes",
      list(
        dashboard.users.map((user) =>
          listRow(
            `<strong>${escapeHtml(user.name)}</strong><p class="muted">${escapeHtml(user.email)}</p>`,
            `<span class="badge info">${escapeHtml(roleLabels[user.role])}</span>`
          )
        )
      )
    );
    document.getElementById("adminUserForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      await api("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          password: form.get("password"),
          role: form.get("role")
        })
      });
      document.getElementById("adminUserMessage").textContent = "Usuario creado correctamente.";
      await loadDashboard(false);
      renderApp();
    });
    return;
  }

  if (section === "courses") {
    heroEyebrow.textContent = "Administrador";
    heroTitle.textContent = "Cursos y asignacion docente";
    heroDescription.textContent = "Crea cursos y asignalos a profesores disponibles.";
    statsGrid.innerHTML = "";
    const teacherOptions = dashboard.users
      .filter((user) => user.role === "teacher")
      .map((teacher) => `<option value="${teacher.id}">${escapeHtml(teacher.name)}</option>`)
      .join("");
    primaryGrid.innerHTML = card(
      "Crear curso",
      `
        <form class="form-grid" id="adminCourseForm">
          ${createInputField("title", "Nombre del curso", "text", "Biologia")}
          ${createInputField("cycle", "Ciclo", "text", "Ciclo 4")}
          <div class="field">
            <label for="teacherId">Profesor</label>
            <select id="teacherId" name="teacherId">${teacherOptions}</select>
          </div>
          <div class="field">
            <label for="description">Descripcion</label>
            <input id="description" name="description" type="text" placeholder="Contenido principal del curso" required />
          </div>
          <div class="field" style="grid-column:1/-1;">
            <button class="btn btn-primary" type="submit">Crear curso</button>
          </div>
        </form>
        <p class="status-note" id="adminCourseMessage">Los cursos nuevos aparecen de inmediato en el panel docente.</p>
      `
    );
    secondaryGrid.innerHTML = card(
      "Listado de cursos",
      list(
        dashboard.courses.map((course) =>
          listRow(
            `<strong>${escapeHtml(course.title)}</strong><p class="muted">${escapeHtml(course.description)}</p>`,
            `<span class="badge info">${escapeHtml(course.teacher?.name || "Sin profesor")}</span>`
          )
        )
      )
    );
    document.getElementById("adminCourseForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      await api("/api/admin/courses", {
        method: "POST",
        body: JSON.stringify({
          title: form.get("title"),
          cycle: form.get("cycle"),
          teacherId: form.get("teacherId"),
          description: form.get("description")
        })
      });
      document.getElementById("adminCourseMessage").textContent = "Curso creado correctamente.";
      await loadDashboard(false);
      renderApp();
    });
    return;
  }

  heroEyebrow.textContent = "Administrador";
  heroTitle.textContent = "Anuncios institucionales";
  heroDescription.textContent = "Publica avisos para toda la comunidad o por audiencia.";
  statsGrid.innerHTML = "";
  primaryGrid.innerHTML = card(
    "Publicar anuncio",
    `
      <form class="stack" id="announcementForm">
        ${createInputField("title", "Titulo", "text", "Comunicado oficial")}
        <div class="field">
          <label for="audience">Audiencia</label>
          <select id="audience" name="audience">
            <option value="all">Toda la comunidad</option>
            <option value="students">Estudiantes</option>
            <option value="parents">Padres</option>
            <option value="teachers">Profesores</option>
          </select>
        </div>
        <div class="field">
          <label for="body">Mensaje</label>
          <textarea id="body" name="body" placeholder="Escribe el anuncio..." required></textarea>
        </div>
        <button class="btn btn-primary" type="submit">Publicar</button>
        <p class="status-note" id="announcementMessage">Los anuncios se reflejan en todos los dashboards.</p>
      </form>
    `
  );
  secondaryGrid.innerHTML = card(
    "Historial de anuncios",
    list(
      dashboard.announcements.map((announcement) =>
        listRow(
          `<strong>${escapeHtml(announcement.title)}</strong><p class="muted">${escapeHtml(announcement.body)}</p>`,
          `<span class="badge warn">${escapeHtml(announcement.audience)}</span>`
        )
      )
    )
  );
  document.getElementById("announcementForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api("/api/admin/announcements", {
      method: "POST",
      body: JSON.stringify({
        title: form.get("title"),
        audience: form.get("audience"),
        body: form.get("body")
      })
    });
    document.getElementById("announcementMessage").textContent = "Anuncio publicado.";
    await loadDashboard(false);
    renderApp();
  });
}

function renderTeacher() {
  const dashboard = state.dashboard;
  const teacherCourses = dashboard.courses;

  if (state.activeSection === "overview") {
    heroEyebrow.textContent = "Profesor";
    heroTitle.textContent = "Gestiona clases, tareas y seguimiento academico";
    heroDescription.textContent = "Tu interfaz permite programar sesiones, crear tareas, pasar asistencia y calificar.";
    statsGrid.innerHTML = [
      stat("Cursos", teacherCourses.length),
      stat("Clases", teacherCourses.flatMap((course) => course.classes).length),
      stat("Tareas", teacherCourses.flatMap((course) => course.assignments).length),
      stat("Entregas", dashboard.submissions.length)
    ].join("");
    const [primary, secondary] = renderTeacherOverview(dashboard, teacherCourses);
    primaryGrid.innerHTML = primary;
    secondaryGrid.innerHTML = secondary;
    return;
  }

  if (state.activeSection === "classes") {
    heroEyebrow.textContent = "Profesor";
    heroTitle.textContent = "Programar clases";
    heroDescription.textContent = "Si no escribes enlace, se genera una sala Jitsi automaticamente.";
    statsGrid.innerHTML = "";
    const courseOptions = teacherCourses.map((course) => `<option value="${course.id}">${escapeHtml(course.title)}</option>`).join("");
    primaryGrid.innerHTML = card(
      "Nueva clase",
      `
        <form class="form-grid" id="classForm">
          <div class="field">
            <label for="courseId">Curso</label>
            <select id="courseId" name="courseId">${courseOptions}</select>
          </div>
          ${createInputField("title", "Titulo", "text", "Clase en vivo")}
          ${createInputField("topic", "Tema", "text", "Sistema de ecuaciones")}
          ${createInputField("startAt", "Fecha y hora", "datetime-local")}
          ${createInputField("meetingUrl", "Enlace de clase opcional", "url", "https://meet...")}
          ${createInputField("recordingUrl", "Grabacion opcional", "url", "https://video...")}
          <div class="field" style="grid-column:1/-1;">
            <label for="aiSummary">Resumen AI</label>
            <textarea id="aiSummary" name="aiSummary" placeholder="Resumen automatico de la sesion"></textarea>
          </div>
          <div class="field" style="grid-column:1/-1;">
            <button class="btn btn-primary" type="submit">Crear clase</button>
          </div>
        </form>
        <p class="status-note" id="classMessage">Cada sesion queda visible para estudiantes y padres.</p>
      `
    );
    secondaryGrid.innerHTML = card(
      "Clases programadas",
      list(
        teacherCourses.flatMap((course) =>
          course.classes.map((session) =>
            listRow(
              `<strong>${escapeHtml(course.title)} · ${escapeHtml(session.topic)}</strong><p class="muted">${escapeHtml(session.meetingUrl)}</p>`,
              `<span class="badge info">${new Date(session.startAt).toLocaleString("es-CO")}</span>`
            )
          )
        ),
        "No hay clases programadas."
      )
    );
    document.getElementById("classForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      await api("/api/teacher/classes", {
        method: "POST",
        body: JSON.stringify({
          courseId: form.get("courseId"),
          title: form.get("title"),
          topic: form.get("topic"),
          startAt: form.get("startAt") ? new Date(form.get("startAt")).toISOString() : new Date().toISOString(),
          meetingUrl: form.get("meetingUrl"),
          recordingUrl: form.get("recordingUrl"),
          aiSummary: form.get("aiSummary")
        })
      });
      document.getElementById("classMessage").textContent = "Clase creada correctamente.";
      await loadDashboard(false);
      renderApp();
    });
    return;
  }

  if (state.activeSection === "assignments") {
    heroEyebrow.textContent = "Profesor";
    heroTitle.textContent = "Crear tareas";
    heroDescription.textContent = "Define entregas, descripcion y puntaje.";
    statsGrid.innerHTML = "";
    const courseOptions = teacherCourses.map((course) => `<option value="${course.id}">${escapeHtml(course.title)}</option>`).join("");
    primaryGrid.innerHTML = card(
      "Nueva tarea",
      `
        <form class="form-grid" id="assignmentForm">
          <div class="field">
            <label for="courseId">Curso</label>
            <select id="courseId" name="courseId">${courseOptions}</select>
          </div>
          ${createInputField("title", "Titulo", "text", "Taller 2")}
          <div class="field">
            <label for="description">Descripcion</label>
            <textarea id="description" name="description" placeholder="Explica la actividad" required></textarea>
          </div>
          ${createInputField("dueAt", "Entrega", "datetime-local")}
          ${createInputField("points", "Puntaje", "number", "5")}
          <div class="field" style="grid-column:1/-1;">
            <button class="btn btn-primary" type="submit">Crear tarea</button>
          </div>
        </form>
        <p class="status-note" id="assignmentMessage">Las tareas aparecen al instante en el panel del estudiante.</p>
      `
    );
    secondaryGrid.innerHTML = card(
      "Tareas vigentes",
      list(
        teacherCourses.flatMap((course) =>
          course.assignments.map((assignment) =>
            listRow(
              `<strong>${escapeHtml(course.title)} · ${escapeHtml(assignment.title)}</strong><p class="muted">${escapeHtml(assignment.description)}</p>`,
              `<span class="badge warn">${new Date(assignment.dueAt).toLocaleDateString("es-CO")}</span>`
            )
          )
        ),
        "No hay tareas creadas."
      )
    );
    document.getElementById("assignmentForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      await api("/api/teacher/assignments", {
        method: "POST",
        body: JSON.stringify({
          courseId: form.get("courseId"),
          title: form.get("title"),
          description: form.get("description"),
          dueAt: form.get("dueAt") ? new Date(form.get("dueAt")).toISOString() : new Date().toISOString(),
          points: form.get("points")
        })
      });
      document.getElementById("assignmentMessage").textContent = "Tarea creada correctamente.";
      await loadDashboard(false);
      renderApp();
    });
    return;
  }

  heroEyebrow.textContent = "Profesor";
  heroTitle.textContent = "Notas y asistencia";
  heroDescription.textContent = "Registra desempeno academico y seguimiento diario.";
  statsGrid.innerHTML = "";
  const studentOptions = teacherCourses
    .flatMap((course) => course.students.map((student) => ({ courseId: course.id, student })))
    .map(({ courseId, student }) => `<option value="${courseId}|${student.id}">${escapeHtml(student.name)} · ${escapeHtml(teacherCourses.find((course) => course.id === courseId).title)}</option>`)
    .join("");
  primaryGrid.innerHTML = [
    card(
      "Registrar nota",
      `
        <form class="stack" id="gradeForm">
          <div class="field">
            <label for="gradeTarget">Estudiante y curso</label>
            <select id="gradeTarget" name="gradeTarget">${studentOptions}</select>
          </div>
          ${createInputField("label", "Actividad", "text", "Quiz 2")}
          ${createInputField("value", "Nota", "number", "4.5")}
          ${createInputField("maxValue", "Maximo", "number", "5")}
          <div class="field">
            <label for="feedback">Retroalimentacion</label>
            <textarea id="feedback" name="feedback" placeholder="Comentario para el estudiante"></textarea>
          </div>
          <button class="btn btn-primary" type="submit">Guardar nota</button>
          <p class="status-note" id="gradeMessage">La nota queda visible para estudiante y padres.</p>
        </form>
      `
    ),
    card(
      "Registrar asistencia",
      `
        <form class="stack" id="attendanceForm">
          <div class="field">
            <label for="attendanceTarget">Estudiante y curso</label>
            <select id="attendanceTarget" name="attendanceTarget">${studentOptions}</select>
          </div>
          <div class="field">
            <label for="status">Estado</label>
            <select id="status" name="status">
              <option value="presente">Presente</option>
              <option value="ausente">Ausente</option>
              <option value="tarde">Tarde</option>
            </select>
          </div>
          ${createInputField("date", "Fecha", "date")}
          <button class="btn btn-primary" type="submit">Guardar asistencia</button>
          <p class="status-note" id="attendanceMessage">La asistencia impacta el panel de padres.</p>
        </form>
      `
    )
  ].join("");
  secondaryGrid.innerHTML = card(
    "Resumen de seguimiento",
    list(
      dashboard.grades.map((grade) =>
        listRow(
          `<strong>${escapeHtml(grade.label)}</strong><p class="muted">${escapeHtml(grade.studentId)} · ${escapeHtml(grade.feedback || "Sin comentario")}</p>`,
          `<span class="badge info">${grade.value}/${grade.maxValue}</span>`
        )
      ),
      "No hay notas registradas."
    )
  );
  document.getElementById("gradeForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const [courseId, studentId] = String(form.get("gradeTarget")).split("|");
    await api("/api/teacher/grades", {
      method: "POST",
      body: JSON.stringify({
        courseId,
        studentId,
        label: form.get("label"),
        value: form.get("value"),
        maxValue: form.get("maxValue"),
        feedback: form.get("feedback")
      })
    });
    document.getElementById("gradeMessage").textContent = "Nota registrada correctamente.";
    await loadDashboard(false);
    renderApp();
  });
  document.getElementById("attendanceForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const [courseId, studentId] = String(form.get("attendanceTarget")).split("|");
    await api("/api/teacher/attendance", {
      method: "POST",
      body: JSON.stringify({
        courseId,
        studentId,
        status: form.get("status"),
        date: form.get("date")
      })
    });
    document.getElementById("attendanceMessage").textContent = "Asistencia registrada.";
    await loadDashboard(false);
    renderApp();
  });
}

function renderStudent() {
  const dashboard = state.dashboard;

  if (state.activeSection === "overview") {
    heroEyebrow.textContent = "Estudiante";
    heroTitle.textContent = `Hola, ${state.session.name}`;
    heroDescription.textContent = "Consulta tus clases, tareas, notas, anuncios y entregas.";
    statsGrid.innerHTML = [
      stat("Cursos", dashboard.courses.length),
      stat("Proximas clases", dashboard.nextClasses.length),
      stat("Tareas", dashboard.courses.flatMap((course) => course.assignments).length),
      stat("Mensajes", dashboard.messages.length)
    ].join("");
    primaryGrid.innerHTML = [
      card(
        "Proximas clases",
        list(
          dashboard.nextClasses.map((item) =>
            listRow(
              `<strong>${escapeHtml(item.courseTitle)}</strong><p class="muted">${escapeHtml(item.topic)}</p>`,
              `<span class="badge info">${new Date(item.startAt).toLocaleString("es-CO")}</span>`
            )
          ),
          "No hay clases proximas."
        )
      ),
      card(
        "Anuncios",
        list(
          dashboard.announcements.map((announcement) =>
            listRow(
              `<strong>${escapeHtml(announcement.title)}</strong><p class="muted">${escapeHtml(announcement.body)}</p>`,
              `<span class="badge warn">${new Date(announcement.createdAt).toLocaleDateString("es-CO")}</span>`
            )
          )
        )
      )
    ].join("");
    secondaryGrid.innerHTML = card(
      "Tus cursos",
      list(
        dashboard.courses.map((course) =>
          listRow(
            `<strong>${escapeHtml(course.title)}</strong><p class="muted">${escapeHtml(course.teacher?.name || "Sin profesor")}</p>`,
            `<span class="badge good">${course.assignments.length} tareas</span>`
          )
        )
      )
    );
    return;
  }

  if (state.activeSection === "courses") {
    heroEyebrow.textContent = "Estudiante";
    heroTitle.textContent = "Mis cursos";
    heroDescription.textContent = "Ahora puedes entrar a una clase embebida tipo Jitsi cuando la sesion tenga enlace generado.";
    statsGrid.innerHTML = "";
    primaryGrid.innerHTML = dashboard.courses
      .map((course) =>
        card(
          course.title,
          `
            ${list(
              course.classes.map((session) =>
                listRow(
                  `<strong>${escapeHtml(session.topic)}</strong><p class="muted">${escapeHtml(session.aiSummary || "Sin resumen AI")}</p>`,
                  `<div class="toolbar">
                    <a class="btn btn-secondary" href="${escapeHtml(session.meetingUrl)}" target="_blank" rel="noreferrer">Abrir clase</a>
                    ${session.recordingUrl ? `<a class="btn btn-secondary" href="${escapeHtml(session.recordingUrl)}" target="_blank" rel="noreferrer">Ver grabacion</a>` : ""}
                  </div>`
                )
              ),
              "Aun no hay clases en este curso."
            )}
            ${
              course.classes.find((session) => session.meetingEmbedUrl)
                ? `<div class="meeting-embed-wrap">
                     <p class="muted" style="margin:16px 0 10px;">Vista embebida de la proxima clase</p>
                     <iframe class="meeting-embed" src="${escapeHtml(course.classes.find((session) => session.meetingEmbedUrl).meetingEmbedUrl)}" allow="camera; microphone; fullscreen; display-capture"></iframe>
                   </div>`
                : ""
            }
            <hr style="border:none;border-top:1px solid rgba(13,34,56,0.08);margin:14px 0;">
            ${list(
              course.grades.map((grade) =>
                listRow(
                  `<strong>${escapeHtml(grade.label)}</strong><p class="muted">${escapeHtml(grade.feedback || "Sin retroalimentacion")}</p>`,
                  `<span class="badge good">${grade.value}/${grade.maxValue}</span>`
                )
              ),
              "Aun no hay notas."
            )}
          `
        )
      )
      .join("");
    secondaryGrid.innerHTML = "";
    return;
  }

  if (state.activeSection === "assignments") {
    heroEyebrow.textContent = "Estudiante";
    heroTitle.textContent = "Entregar tareas";
    heroDescription.textContent = "Ahora puedes subir archivo directamente o dejar enlace.";
    statsGrid.innerHTML = "";
    const assignmentOptions = dashboard.courses
      .flatMap((course) => course.assignments.map((assignment) => ({ course, assignment })))
      .map(({ course, assignment }) => `<option value="${assignment.id}">${escapeHtml(course.title)} · ${escapeHtml(assignment.title)}</option>`)
      .join("");
    primaryGrid.innerHTML = card(
      "Nueva entrega",
      `
        <form class="stack" id="submissionForm">
          <div class="field">
            <label for="assignmentId">Tarea</label>
            <select id="assignmentId" name="assignmentId">${assignmentOptions}</select>
          </div>
          ${createInputField("url", "Enlace opcional", "url", "https://drive.google.com/...")}
          <div class="field">
            <label for="file">Archivo</label>
            <input id="file" name="file" type="file" />
          </div>
          <div class="field">
            <label for="comment">Comentario</label>
            <textarea id="comment" name="comment" placeholder="Descripcion corta de la entrega"></textarea>
          </div>
          <button class="btn btn-primary" type="submit">Enviar entrega</button>
          <p class="status-note" id="submissionMessage">Si subes archivo, el backend lo guarda localmente en /uploads.</p>
        </form>
      `
    );
    secondaryGrid.innerHTML = card(
      "Estado de entregas",
      list(
        dashboard.courses.flatMap((course) =>
          course.submissions.map((submission) =>
            listRow(
              `<strong>${escapeHtml(course.title)}</strong><p class="muted">${escapeHtml(submission.fileName || submission.comment || "Entrega registrada")}</p>`,
              `<div class="toolbar">
                ${submission.fileUrl ? `<a class="btn btn-secondary" href="${escapeHtml(submission.fileUrl)}" target="_blank" rel="noreferrer">Ver archivo</a>` : ""}
                ${submission.url ? `<a class="btn btn-secondary" href="${escapeHtml(submission.url)}" target="_blank" rel="noreferrer">Ver enlace</a>` : ""}
              </div>`
            )
          )
        ),
        "Todavia no has enviado tareas."
      )
    );
    document.getElementById("submissionForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const file = form.get("file");
      if (file && file.size > 0) {
        const uploadForm = new FormData();
        uploadForm.append("assignmentId", form.get("assignmentId"));
        uploadForm.append("comment", form.get("comment"));
        uploadForm.append("file", file);
        await api("/api/student/submissions/upload", {
          method: "POST",
          body: uploadForm
        });
      } else {
        await api("/api/student/submissions", {
          method: "POST",
          body: JSON.stringify({
            assignmentId: form.get("assignmentId"),
            url: form.get("url"),
            comment: form.get("comment")
          })
        });
      }
      document.getElementById("submissionMessage").textContent = "Entrega enviada correctamente.";
      await loadDashboard(false);
      renderApp();
    });
    return;
  }

  heroEyebrow.textContent = "Estudiante";
  heroTitle.textContent = "Mensajes";
  heroDescription.textContent = "Escribe a docentes o acudientes desde la misma plataforma.";
  statsGrid.innerHTML = "";
  primaryGrid.innerHTML = card(
    "Enviar mensaje",
    `
      <form class="stack" id="messageForm">
        <div class="field">
          <label for="recipient">Destinatario</label>
          <select id="recipient" name="recipient">${getRecipientOptions(["teacher", "parent", "admin"])}</select>
        </div>
        <div class="field">
          <label for="body">Mensaje</label>
          <textarea id="body" name="body" placeholder="Escribe tu mensaje..." required></textarea>
        </div>
        <button class="btn btn-primary" type="submit">Enviar</button>
        <p class="status-note" id="messageResponse">Los mensajes quedan visibles para ambos usuarios.</p>
      </form>
    `
  );
  secondaryGrid.innerHTML = card(
    "Conversacion",
    list(
      dashboard.messages.map((message) =>
        listRow(
          `<strong>${escapeHtml(message.body)}</strong><p class="muted">${escapeHtml(message.fromUserId)} → ${escapeHtml(message.toUserId)}</p>`,
          `<span class="badge info">${new Date(message.createdAt).toLocaleDateString("es-CO")}</span>`
        )
      ),
      "No hay mensajes todavia."
    )
  );
  document.getElementById("messageForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api("/api/messages", {
      method: "POST",
      body: JSON.stringify({
        toUserId: form.get("recipient"),
        body: form.get("body")
      })
    });
    document.getElementById("messageResponse").textContent = "Mensaje enviado.";
    await loadDashboard(false);
    renderApp();
  });
}

function renderParent() {
  const dashboard = state.dashboard;
  const children = dashboard.children;

  if (state.activeSection === "overview") {
    heroEyebrow.textContent = "Padres";
    heroTitle.textContent = "Seguimiento de tus hijos";
    heroDescription.textContent = "Consulta notas, asistencia, tareas, clases y mensajes del equipo docente.";
    statsGrid.innerHTML = [
      stat("Hijos vinculados", children.length),
      stat("Cursos activos", children.flatMap((child) => child.courses).length),
      stat("Alertas", children.flatMap((child) => child.courses.flatMap((course) => course.assignments)).length),
      stat("Mensajes", dashboard.messages.length)
    ].join("");
    primaryGrid.innerHTML = children
      .map((child) =>
        card(
          child.name,
          list(
            child.courses.map((course) => {
              const attendanceLabel = course.attendance[course.attendance.length - 1]?.status || "sin asistencia";
              return listRow(
                `<strong>${escapeHtml(course.title)}</strong><p class="muted">${escapeHtml(course.teacher?.name || "Sin docente")}</p>`,
                `<span class="badge ${attendanceLabel === "ausente" ? "danger" : "good"}">${escapeHtml(attendanceLabel)}</span>`
              );
            }),
            "No hay cursos vinculados."
          )
        )
      )
      .join("");
    secondaryGrid.innerHTML = card(
      "Anuncios",
      list(
        dashboard.announcements.map((announcement) =>
          listRow(
            `<strong>${escapeHtml(announcement.title)}</strong><p class="muted">${escapeHtml(announcement.body)}</p>`,
            `<span class="badge warn">${escapeHtml(announcement.audience)}</span>`
          )
        )
      )
    );
    return;
  }

  if (state.activeSection === "children") {
    heroEyebrow.textContent = "Padres";
    heroTitle.textContent = "Detalle por hijo";
    heroDescription.textContent = "Revisa notas, asistencia, actividades y clases por estudiante.";
    statsGrid.innerHTML = "";
    primaryGrid.innerHTML = children
      .map((child) =>
        card(
          `Detalle de ${child.name}`,
          child.courses
            .map(
              (course) => `
                <div class="list-row">
                  <div>
                    <strong>${escapeHtml(course.title)}</strong>
                    <p class="muted">Docente: ${escapeHtml(course.teacher?.name || "Sin docente")}</p>
                    <p class="muted">Notas: ${course.grades.map((item) => `${item.label} ${item.value}/${item.maxValue}`).join(" · ") || "Sin notas"}</p>
                    <p class="muted">Proxima clase: ${course.classes[0] ? escapeHtml(course.classes[0].topic) : "Sin clase programada"}</p>
                  </div>
                  <span class="badge info">${course.assignments.length} tareas</span>
                </div>
              `
            )
            .join("")
        )
      )
      .join("");
    secondaryGrid.innerHTML = "";
    return;
  }

  if (state.activeSection === "alerts") {
    heroEyebrow.textContent = "Padres";
    heroTitle.textContent = "Alertas academicas";
    heroDescription.textContent = "Pendientes y observaciones para acompanar mejor el proceso.";
    statsGrid.innerHTML = "";
    primaryGrid.innerHTML = card(
      "Pendientes",
      list(
        children.flatMap((child) =>
          child.courses.flatMap((course) =>
            course.assignments.map((assignment) =>
              listRow(
                `<strong>${escapeHtml(child.name)} · ${escapeHtml(assignment.title)}</strong><p class="muted">${escapeHtml(course.title)}</p>`,
                `<span class="badge warn">${new Date(assignment.dueAt).toLocaleDateString("es-CO")}</span>`
              )
            )
          )
        ),
        "No hay alertas activas."
      )
    );
    secondaryGrid.innerHTML = card(
      "Mensajes con docentes",
      list(
        dashboard.messages.map((message) =>
          listRow(
            `<strong>${escapeHtml(message.body)}</strong><p class="muted">${escapeHtml(message.fromUserId)} → ${escapeHtml(message.toUserId)}</p>`,
            `<span class="badge info">${new Date(message.createdAt).toLocaleDateString("es-CO")}</span>`
          )
        )
      )
    );
    return;
  }

  heroEyebrow.textContent = "Padres";
  heroTitle.textContent = "Mensajeria";
  heroDescription.textContent = "Envio de mensajes a docentes y coordinacion.";
  statsGrid.innerHTML = "";
  primaryGrid.innerHTML = card(
    "Nuevo mensaje",
    `
      <form class="stack" id="parentMessageForm">
        <div class="field">
          <label for="recipient">Destinatario</label>
          <select id="recipient" name="recipient">${getRecipientOptions(["teacher", "admin"])}</select>
        </div>
        <div class="field">
          <label for="body">Mensaje</label>
          <textarea id="body" name="body" placeholder="Escribe tu mensaje..." required></textarea>
        </div>
        <button class="btn btn-primary" type="submit">Enviar</button>
        <p class="status-note" id="parentMessageResponse">Los mensajes quedan guardados en el backend.</p>
      </form>
    `
  );
  secondaryGrid.innerHTML = card(
    "Historial",
    list(
      dashboard.messages.map((message) =>
        listRow(
          `<strong>${escapeHtml(message.body)}</strong><p class="muted">${escapeHtml(message.fromUserId)} → ${escapeHtml(message.toUserId)}</p>`,
          `<span class="badge info">${new Date(message.createdAt).toLocaleDateString("es-CO")}</span>`
        )
      )
    )
  );
  document.getElementById("parentMessageForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api("/api/messages", {
      method: "POST",
      body: JSON.stringify({
        toUserId: form.get("recipient"),
        body: form.get("body")
      })
    });
    document.getElementById("parentMessageResponse").textContent = "Mensaje enviado.";
    await loadDashboard(false);
    renderApp();
  });
}

function renderApp() {
  if (!state.session || !state.dashboard) {
    loginSection.classList.remove("hidden");
    appLayout.classList.remove("active");
    logoutButton.classList.add("hidden");
    currentRoleBadge.textContent = "Sin sesion";
    statsGrid.innerHTML = "";
    primaryGrid.innerHTML = "";
    secondaryGrid.innerHTML = "";
    return;
  }

  loginSection.classList.add("hidden");
  appLayout.classList.add("active");
  logoutButton.classList.remove("hidden");
  currentRoleBadge.textContent = roleLabels[state.session.role];
  renderSidebar();

  if (state.session.role === "admin") renderAdmin();
  if (state.session.role === "teacher") renderTeacher();
  if (state.session.role === "student") renderStudent();
  if (state.session.role === "parent") renderParent();
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(loginForm);
  loginMessage.textContent = "Ingresando...";
  try {
    await login(form.get("email"), form.get("password"));
    loginMessage.textContent = "Sesion iniciada correctamente.";
  } catch (error) {
    loginMessage.textContent = error.message;
  }
});

reloadDashboard.addEventListener("click", async () => {
  if (!state.session) return;
  await loadDashboard(false);
});

logoutButton.addEventListener("click", logout);

Promise.all([loadCredentials(), restoreSession()]).catch((error) => {
  loginMessage.textContent = error.message;
});
