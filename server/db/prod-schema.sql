-- ============================================================
--  GreenCare — PRODUCTION SCHEMA
--  Target: MySQL 8.0.16+ / MariaDB 10.4+
--  Charset: utf8mb4 / utf8mb4_0900_ai_ci
--  Engine:  InnoDB
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS greencare
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;
USE greencare;

-- ── 1. AUTH ──────────────────────────────────────────────────

CREATE TABLE users (
  id            VARCHAR(32)  NOT NULL,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,       -- bcrypt/argon2 in prod
  role          ENUM('user','admin','moderator') NOT NULL DEFAULT 'user',
  photo_url     VARCHAR(500) NULL,
  location      VARCHAR(160) NULL,
  email_verified_at DATETIME NULL,
  last_login_at DATETIME     NULL,
  disabled_at   DATETIME     NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE user_settings (
  user_id            VARCHAR(32) NOT NULL,
  care_reminders     TINYINT(1)  NOT NULL DEFAULT 1,
  overdue_reminders  TINYINT(1)  NOT NULL DEFAULT 1,
  health_alerts      TINYINT(1)  NOT NULL DEFAULT 1,
  browser_notifs     TINYINT(1)  NOT NULL DEFAULT 0,
  theme              ENUM('light','dark','system') NOT NULL DEFAULT 'system',
  reminder_time      TIME        NOT NULL DEFAULT '08:00:00',
  week_start         ENUM('mon','sun') NOT NULL DEFAULT 'mon',
  timezone           VARCHAR(64) NOT NULL DEFAULT 'UTC',   -- ← new: push scheduling
  updated_at         DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_settings_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── 2. SPECIES LIBRARY ───────────────────────────────────────

CREATE TABLE species (
  id              VARCHAR(32)  NOT NULL,
  common_name     VARCHAR(160) NOT NULL,
  scientific_name VARCHAR(190) NOT NULL,
  difficulty      ENUM('Beginner','Intermediate','Advanced') NOT NULL DEFAULT 'Beginner',
  light           VARCHAR(80)  NULL,
  watering        VARCHAR(80)  NULL,
  fertilizing     VARCHAR(80)  NULL,
  zone            ENUM('indoor','outdoor') NOT NULL DEFAULT 'indoor',
  light_level     ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
  description     TEXT         NULL,
  photo_url       VARCHAR(500) NULL,
  source          ENUM('seed','trefle','user') NOT NULL DEFAULT 'seed',
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_species_scientific (scientific_name),
  KEY idx_species_common (common_name),
  KEY idx_species_zone   (zone, light_level, difficulty)
) ENGINE=InnoDB;

-- cache mirrors species; kept separate so it can be wiped/rebuilt
CREATE TABLE species_cache LIKE species;
ALTER TABLE species_cache
  DROP INDEX uq_species_scientific,
  ADD KEY idx_species_scientific (scientific_name);

CREATE TABLE species_problems (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  species_id  VARCHAR(32)     NOT NULL,
  problem     VARCHAR(255)    NOT NULL,
  sort_order  INT             NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_species_problems (species_id, sort_order),
  CONSTRAINT fk_sp_problems FOREIGN KEY (species_id)
    REFERENCES species(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE species_tips (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  species_id  VARCHAR(32)     NOT NULL,
  tip         VARCHAR(255)    NOT NULL,
  sort_order  INT             NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_species_tips (species_id, sort_order),
  CONSTRAINT fk_sp_tips FOREIGN KEY (species_id)
    REFERENCES species(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── 3. HEALTH ISSUES ─────────────────────────────────────────

CREATE TABLE health_issues (
  id          VARCHAR(48) NOT NULL,
  name        VARCHAR(80) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_health_issue_name (name)
) ENGINE=InnoDB;

CREATE TABLE health_issue_causes (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  issue_id    VARCHAR(48)     NOT NULL,
  cause       VARCHAR(255)    NOT NULL,
  sort_order  INT             NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_hic (issue_id, sort_order),
  CONSTRAINT fk_hic FOREIGN KEY (issue_id)
    REFERENCES health_issues(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE health_issue_tips (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  issue_id    VARCHAR(48)     NOT NULL,
  tip         VARCHAR(255)    NOT NULL,
  sort_order  INT             NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_hit (issue_id, sort_order),
  CONSTRAINT fk_hit FOREIGN KEY (issue_id)
    REFERENCES health_issues(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── 4. USER PLANTS ───────────────────────────────────────────

CREATE TABLE plants (
  id              VARCHAR(32)  NOT NULL,
  user_id         VARCHAR(32)  NOT NULL,
  species_id      VARCHAR(32)  NULL,
  name            VARCHAR(120) NOT NULL,
  species_name    VARCHAR(160) NOT NULL,
  location        VARCHAR(160) NULL,
  zone            ENUM('indoor','outdoor') NOT NULL DEFAULT 'indoor',
  light           VARCHAR(80)  NULL,
  watering        VARCHAR(80)  NULL,
  fertilizing     VARCHAR(80)  NULL,
  health          ENUM('Healthy','Good','Needs Attention','Critical')
                    NOT NULL DEFAULT 'Good',
  last_watered    DATE         NULL,
  next_task_type  ENUM('Water','Fertilize','Prune','Repot','Clean','Check','Rotate') NULL,
  next_task_date  DATE         NULL,
  notes           TEXT         NULL,
  photo_url       VARCHAR(500) NULL,
  added_at        DATE         NULL,
  archived_at     DATETIME     NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_plants_user       (user_id, archived_at),
  KEY idx_plants_health     (health),
  KEY idx_plants_species    (species_id),
  KEY idx_plants_next_task  (user_id, next_task_date),
  CONSTRAINT fk_plants_user    FOREIGN KEY (user_id)    REFERENCES users(id)          ON DELETE CASCADE,
  CONSTRAINT fk_plants_species FOREIGN KEY (species_id) REFERENCES species_cache(id)  ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE plant_timeline (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  plant_id    VARCHAR(32)     NOT NULL,
  label       VARCHAR(160)    NOT NULL,
  event_date  DATE            NOT NULL,
  sort_order  INT             NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_timeline (plant_id, event_date),
  CONSTRAINT fk_timeline_plant FOREIGN KEY (plant_id)
    REFERENCES plants(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── 5. TASKS ─────────────────────────────────────────────────

CREATE TABLE tasks (
  id                        VARCHAR(32)  NOT NULL,
  user_id                   VARCHAR(32)  NOT NULL,
  plant_id                  VARCHAR(32)  NOT NULL,
  type                      ENUM('Water','Fertilize','Prune','Repot','Clean','Check','Rotate') NOT NULL,
  task_date                 DATE         NOT NULL,
  task_time                 VARCHAR(20)  NOT NULL DEFAULT 'Anytime',
  status                    ENUM('pending','completed','overdue','skipped') NOT NULL DEFAULT 'pending',
  priority                  ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
  is_repeating              INT          NULL,
  completed_at              DATETIME     NULL,
  last_overdue_notified_at  DATETIME     NULL,
  deleted_at                DATETIME     NULL,   -- soft delete
  created_at                DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tasks_user_date    (user_id, task_date),
  KEY idx_tasks_plant        (plant_id),
  KEY idx_tasks_status       (user_id, status, task_date),
  KEY idx_tasks_due_today    (user_id, task_date, status),
  KEY idx_tasks_overdue      (user_id, task_date, status, last_overdue_notified_at),
  CONSTRAINT fk_tasks_user  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
  CONSTRAINT fk_tasks_plant FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── 6. JOURNAL ───────────────────────────────────────────────

CREATE TABLE journal_entries (
  id           VARCHAR(32)  NOT NULL,
  user_id      VARCHAR(32)  NOT NULL,
  plant_id     VARCHAR(32)  NULL,
  activity     VARCHAR(64)  NOT NULL,
  entry_date   DATE         NOT NULL,
  notes        TEXT         NULL,
  photo_url    VARCHAR(500) NULL,
  archived_at  DATETIME     NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_journal_user_date (user_id, entry_date),
  KEY idx_journal_plant     (plant_id, entry_date),
  CONSTRAINT fk_journal_user  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
  CONSTRAINT fk_journal_plant FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ── 7. NOTIFICATIONS ─────────────────────────────────────────

CREATE TABLE notifications (
  id           VARCHAR(48)  NOT NULL,
  user_id      VARCHAR(32)  NOT NULL,
  dedupe_key   VARCHAR(255) NOT NULL,
  type         ENUM('task_due','task_overdue','health_alert','system','weekly_summary')
                 NOT NULL DEFAULT 'system',
  title        VARCHAR(160) NOT NULL,
  body         VARCHAR(500) NULL,
  notice_date  DATE         NOT NULL,
  is_read      TINYINT(1)   NOT NULL DEFAULT 0,
  read_at      DATETIME     NULL,
  dismissed_at DATETIME     NULL,
  page         VARCHAR(32)  NULL,
  plant_id     VARCHAR(32)  NULL,
  task_id      VARCHAR(32)  NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_notif_dedupe (user_id, dedupe_key),
  KEY idx_notif_unread  (user_id, is_read, created_at),
  KEY idx_notif_type    (user_id, type, is_read),
  KEY idx_notif_plant   (plant_id),
  CONSTRAINT fk_notif_user  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
  CONSTRAINT fk_notif_plant FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE SET NULL,
  CONSTRAINT fk_notif_task  FOREIGN KEY (task_id)  REFERENCES tasks(id)  ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE push_subscriptions (
  id                 VARCHAR(32)  NOT NULL,
  user_id            VARCHAR(32)  NOT NULL,
  endpoint           VARCHAR(512) NOT NULL,
  endpoint_hash      CHAR(64)     NOT NULL,  -- sha256 hex; enforces UNIQUE reliably
  p256dh             VARCHAR(255) NOT NULL,
  auth               VARCHAR(255) NOT NULL,
  user_agent         VARCHAR(255) NULL,
  expires_at         DATETIME     NULL,
  created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_push_endpoint_hash (endpoint_hash),
  KEY idx_push_user (user_id),
  CONSTRAINT fk_push_sub_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── 8. ACTIVITY FEED ─────────────────────────────────────────

CREATE TABLE activity_log (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      VARCHAR(32)     NOT NULL,
  text         VARCHAR(255)    NOT NULL,
  occurred_at  DATETIME        NOT NULL,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_activity_user (user_id, occurred_at DESC),
  CONSTRAINT fk_activity_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── 9. ADMIN ─────────────────────────────────────────────────

CREATE TABLE admin_reports (
  id           VARCHAR(32)  NOT NULL,
  user_id      VARCHAR(32)  NULL,
  subject      VARCHAR(255) NOT NULL,
  detail       TEXT         NULL,
  status       ENUM('open','resolved','dismissed') NOT NULL DEFAULT 'open',
  resolved_by  VARCHAR(32)  NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at  DATETIME     NULL,
  PRIMARY KEY (id),
  KEY idx_reports_status (status, created_at),
  CONSTRAINT fk_reports_user     FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_reports_resolver FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE notification_templates (
  id             VARCHAR(32)  NOT NULL,
  name           VARCHAR(128) NOT NULL,
  trigger_event  VARCHAR(255) NOT NULL,
  body           TEXT         NOT NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tpl_name (name)
) ENGINE=InnoDB;

CREATE TABLE system_settings (
  setting_key  VARCHAR(64)  NOT NULL,
  setting_val  VARCHAR(255) NOT NULL,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB;

-- ── 10. SESSIONS ─────────────────────────────────────────────

CREATE TABLE sessions (
  session_id VARCHAR(128) NOT NULL,
  expires    DATETIME     NOT NULL,
  data       TEXT         NULL,
  PRIMARY KEY (session_id),
  KEY idx_sessions_expires (expires)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;