create table if not exists users (
  id uuid primary key,
  name text not null,
  email text unique not null,
  password text not null,
  role text not null check (role in ('admin', 'teacher', 'student', 'parent')),
  phone text default '',
  children_ids jsonb default '[]'::jsonb
);

create table if not exists courses (
  id uuid primary key,
  title text not null,
  cycle text not null,
  description text not null,
  teacher_id uuid not null references users(id)
);

create table if not exists enrollments (
  id uuid primary key,
  student_id uuid not null references users(id),
  course_id uuid not null references courses(id)
);

create table if not exists classes (
  id uuid primary key,
  course_id uuid not null references courses(id),
  title text not null,
  topic text not null,
  start_at timestamptz not null,
  meeting_url text not null,
  recording_url text default '',
  ai_summary text default ''
);

create table if not exists assignments (
  id uuid primary key,
  course_id uuid not null references courses(id),
  title text not null,
  description text not null,
  due_at timestamptz not null,
  points numeric not null
);

create table if not exists submissions (
  id uuid primary key,
  assignment_id uuid not null references assignments(id),
  course_id uuid not null references courses(id),
  student_id uuid not null references users(id),
  url text default '',
  file_url text default '',
  file_name text default '',
  comment text default '',
  submitted_at timestamptz not null
);

create table if not exists grades (
  id uuid primary key,
  course_id uuid not null references courses(id),
  student_id uuid not null references users(id),
  label text not null,
  value numeric not null,
  max_value numeric not null,
  feedback text default ''
);

create table if not exists attendance (
  id uuid primary key,
  course_id uuid not null references courses(id),
  student_id uuid not null references users(id),
  status text not null,
  date date not null
);

create table if not exists announcements (
  id uuid primary key,
  title text not null,
  body text not null,
  audience text not null,
  created_at timestamptz not null,
  created_by uuid not null references users(id)
);

create table if not exists messages (
  id uuid primary key,
  from_user_id uuid not null references users(id),
  to_user_id uuid not null references users(id),
  body text not null,
  created_at timestamptz not null
);
