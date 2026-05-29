-- ============================================================
-- Vibetime Light — Schema SQL
-- À exécuter dans Supabase SQL Editor
-- ============================================================

-- 1. Création du schema
CREATE SCHEMA IF NOT EXISTS light;
GRANT USAGE ON SCHEMA light TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA light TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA light GRANT ALL ON TABLES TO service_role;

-- ============================================================
-- 2. USERS
-- ============================================================
CREATE TABLE light.users (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT,
  image         TEXT,
  role          TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('ADMIN', 'MANAGER', 'USER')),
  manager_id    TEXT REFERENCES light.users(id) ON DELETE SET NULL,
  work_schedule JSONB,
  monday_user_id TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON light.users(email);
CREATE INDEX idx_users_manager_id ON light.users(manager_id);

-- ============================================================
-- 3. PROJECTS
-- ============================================================
CREATE TABLE light.projects (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name             TEXT NOT NULL,
  deadline         DATE,
  color            TEXT,
  monday_item_id   TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_monday_item_id ON light.projects(monday_item_id);

-- ============================================================
-- 4. MONDAY SUB TASKS
-- ============================================================
CREATE TABLE light.monday_sub_tasks (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  project_id          TEXT NOT NULL REFERENCES light.projects(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  monday_sub_item_id  TEXT UNIQUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_monday_sub_tasks_project_id ON light.monday_sub_tasks(project_id);

-- ============================================================
-- 5. PROJECT ALLOCATIONS (capacity planning)
-- ============================================================
CREATE TABLE light.project_allocations (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id         TEXT NOT NULL REFERENCES light.users(id) ON DELETE CASCADE,
  project_id      TEXT NOT NULL REFERENCES light.projects(id) ON DELETE CASCADE,
  planned_hours   NUMERIC(5,2) NOT NULL CHECK (planned_hours > 0),
  week_start      DATE NOT NULL,
  created_by_id   TEXT NOT NULL REFERENCES light.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, project_id, week_start)
);

CREATE INDEX idx_allocations_user_week ON light.project_allocations(user_id, week_start);
CREATE INDEX idx_allocations_project ON light.project_allocations(project_id);

-- ============================================================
-- 6. TIME ENTRIES
-- ============================================================
CREATE TABLE light.time_entries (
  id                   TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id              TEXT NOT NULL REFERENCES light.users(id) ON DELETE CASCADE,
  logged_by_id         TEXT NOT NULL REFERENCES light.users(id),
  project_id           TEXT NOT NULL REFERENCES light.projects(id) ON DELETE CASCADE,
  monday_sub_task_id   TEXT REFERENCES light.monday_sub_tasks(id) ON DELETE SET NULL,
  date                 DATE NOT NULL,
  hours                NUMERIC(4,2) NOT NULL CHECK (hours > 0 AND hours <= 24),
  note                 TEXT,
  monday_synced_at     TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_time_entries_user_date ON light.time_entries(user_id, date);
CREATE INDEX idx_time_entries_project ON light.time_entries(project_id);
CREATE INDEX idx_time_entries_unsynced ON light.time_entries(monday_synced_at) WHERE monday_synced_at IS NULL;

-- ============================================================
-- 7. GOOGLE CALENDAR TOKENS
-- ============================================================
CREATE TABLE light.google_calendar_tokens (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id             TEXT NOT NULL UNIQUE REFERENCES light.users(id) ON DELETE CASCADE,
  access_token        TEXT NOT NULL,
  refresh_token       TEXT,
  expires_at          TIMESTAMPTZ,
  watch_channel_id    TEXT,
  watch_resource_id   TEXT,
  watch_expiry        TIMESTAMPTZ,
  watch_sync_token    TEXT,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 8. MONDAY CONFIG (singleton)
-- ============================================================
CREATE TABLE light.monday_config (
  id                TEXT PRIMARY KEY DEFAULT 'singleton',
  board_id          TEXT NOT NULL,
  hours_column_id   TEXT,
  webhook_secret    TEXT,
  last_synced_at    TIMESTAMPTZ,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 9. SESSIONS (NextAuth)
-- ============================================================
CREATE TABLE light.sessions (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id       TEXT NOT NULL REFERENCES light.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  expires       TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_sessions_token ON light.sessions(session_token);
CREATE INDEX idx_sessions_user_id ON light.sessions(user_id);

CREATE TABLE light.accounts (
  id                    TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id               TEXT NOT NULL REFERENCES light.users(id) ON DELETE CASCADE,
  provider              TEXT NOT NULL,
  provider_account_id   TEXT NOT NULL,
  access_token          TEXT,
  refresh_token         TEXT,
  expires_at            BIGINT,
  token_type            TEXT,
  scope                 TEXT,
  id_token              TEXT,
  UNIQUE (provider, provider_account_id)
);

CREATE INDEX idx_accounts_user_id ON light.accounts(user_id);

-- ============================================================
-- 10. VUE : conflits de charge par utilisateur / semaine
-- ============================================================
CREATE OR REPLACE VIEW light.capacity_conflicts AS
SELECT
  a.user_id,
  a.week_start,
  SUM(a.planned_hours) AS allocated_hours,
  -- La capacité est calculée côté app depuis work_schedule
  -- Cette vue expose les allocations agrégées par semaine
  ROW_NUMBER() OVER (PARTITION BY a.user_id ORDER BY a.week_start) AS rn
FROM light.project_allocations a
GROUP BY a.user_id, a.week_start;
