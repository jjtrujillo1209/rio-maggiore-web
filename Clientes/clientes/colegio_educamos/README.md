# Colegio Educamos

Propuesta inicial de cliente basada en el análisis de la presencia digital de `Educamos Online`.

## Archivos

- `index.html`: landing comercial del colegio virtual.
- `estudio_colegio_educamos.html`: estudio de marca, diagnóstico y oportunidades del negocio.
- `propuesta_colegio_educamos.html`: documento de propuesta comercial y funcional.
- `assets/`: recursos visuales tomados del sitio de referencia.
- `platform.html`: interfaz de plataforma conectada al backend.
- `platform.css` / `platform.js`: estilos y lógica de la plataforma.
- `server.js`: backend Express con autenticación JWT, roles, subida de archivos y API.
- `data/store.json`: persistencia local con datos semilla.
- `data/postgres-schema.sql`: esquema base para migrar a PostgreSQL o Supabase.
- `uploads/`: archivos enviados por estudiantes.
- `package.json`: dependencias y scripts del proyecto.

## Fuentes base

- https://www.educamosonline.com/
- https://www.educamosonline.com/contact-us/
- https://www.educamosonline.com/primaria-y-bachillerato/

## Enfoque

La propuesta no replica el sitio actual. Reordena la oferta para un colegio virtual más claro, confiable y orientado a conversión:

- admisiones en menos pasos
- seguimiento académico visible para estudiantes y familias
- acceso rápido a clases, tareas, pagos y soporte
- lenguaje de marca más consistente

## Estado actual de la plataforma

- Login con JWT y sesión persistida en frontend.
- Roles funcionales: admin, profesor, estudiante y padres.
- Gestión de cursos, clases, tareas, notas, asistencia, anuncios y mensajes.
- Clases con enlace Jitsi autogenerado si el profesor no define uno.
- Vista embebida de clase en el panel del estudiante cuando la sesión usa Jitsi.
- Subida real de archivos de tareas al backend en `uploads/`.
- Modo local con persistencia JSON y esquema preparado para PostgreSQL.

## Cómo ejecutar

1. Instalar dependencias:
   `npm install`
2. Iniciar el servidor:
   `npm start`
3. Abrir:
   `http://localhost:3100/`
4. Entrar a la plataforma:
   `http://localhost:3100/platform`

## Base de datos

- Modo actual por defecto: `json-demo`
- Archivo de datos: `data/store.json`
- Esquema preparado para PostgreSQL: `data/postgres-schema.sql`
- Si luego quieres migrarlo a PostgreSQL o Supabase, ya está modelada la estructura principal de tablas.

## Accesos demo

- Admin: `admin@educamos.demo` / `demo123`
- Profesor: `profesor@educamos.demo` / `demo123`
- Tutor: `tutor@educamos.demo` / `demo123`
- Estudiante: `estudiante@educamos.demo` / `demo123`
- Padre: `padre@educamos.demo` / `demo123`
