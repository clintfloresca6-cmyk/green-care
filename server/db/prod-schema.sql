-- ============================================================
--  GreenCare — Production MySQL Schema (structure only)
--  Target: MySQL 5.7+, MySQL 8.0+, MariaDB 10.4+
--  Charset: utf8mb4 / utf8mb4_unicode_ci   Engine: InnoDB
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE DATABASE IF NOT EXISTS greencare
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE greencare;

-- ============================================================
--  1. ACCOUNTS
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id             CHAR(26)     NOT NULL,                 -- ULID preferred over auto-inc
  name           VARCHAR(120) NOT NULL,
  email          VARCHAR(190) NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,                 -- bcrypt / argon2 / scrypt
  role           ENUM('user','admin','moderator') NOT NULL DEFAULT 'user',
  status         ENUM('active','suspended','deleted') NOT NULL DEFAULT 'active',
  photo_url      VARCHAR(500) NULL,
  location       VARCHAR(160) NULL,
  email_verified TINYINT(1)   NOT NULL DEFAULT 0,
  last_login_at  DATETIME     NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                              ON UPDATE CURRENT_TIMESTAMP,
  archived_at    DATETIME     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role_status (role, status),
  KEY idx_users_archived    (archived_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_settings (
  user_id            CHAR(26)    NOT NULL,
  care_reminders     TINYINT(1)  NOT NULL DEFAULT 1,
  overdue_reminders  TINYINT(1)  NOT NULL DEFAULT 1,
  health_alerts      TINYINT(1)  NOT NULL DEFAULT 1,
  browser_notifs     TINYINT(1)  NOT NULL DEFAULT 0,
  theme              ENUM('light','dark','system') NOT NULL DEFAULT 'system',
  reminder_time      TIME        NOT NULL DEFAULT '08:00:00',
  week_start         ENUM('mon','sun') NOT NULL DEFAULT 'mon',
  timezone           VARCHAR(64) NOT NULL DEFAULT 'UTC',
  updated_at         DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP
                                 ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_settings_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
--  2. AUTH TOKENS
--     One row per active refresh token / password reset / verify.
-- ============================================================

CREATE TABLE IF NOT EXISTS auth_tokens (
  id           CHAR(26)     NOT NULL,
  user_id      CHAR(26)     NOT NULL,
  token_hash   CHAR(64)     NOT NULL,                   -- sha256 of the raw token
  purpose      ENUM('refresh','password_reset','email_verify','invite') NOT NULL,
  expires_at   DATETIME     NOT NULL,
  revoked_at   DATETIME     NULL,
  user_agent   VARCHAR(255) NULL,
  ip_address   VARBINARY(16) NULL,                      -- INET6_ATON()
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_auth_token_hash (token_hash),
  KEY idx_auth_user_purpose (user_id, purpose, expires_at),
  CONSTRAINT fk_auth_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
--  3. EXTERNAL SPECIES CACHE
--     Populated from a third-party plant API. The API is the
--     source of truth; this table exists to (a) cache lookups,
--     (b) let plants keep a stable FK even if the upstream ID
--     format changes, (c) survive API downtime.
-- ============================================================

CREATE TABLE IF NOT EXISTS species_cache (
  id                CHAR(26)      NOT NULL,
  provider          VARCHAR(64)   NOT NULL,             -- e.g. 'perenual', 'trefle'
  external_id       VARCHAR(128)  NOT NULL,             -- provider's ID
  common_name       VARCHAR(200)  NOT NULL,
  scientific_name   VARCHAR(200)  NULL,
  family            VARCHAR(120)  NULL,
  difficulty        ENUM('Beginner','Intermediate','Advanced') NULL,
  light             VARCHAR(80)   NULL,
  watering          VARCHAR(80)   NULL,
  fertilizing       VARCHAR(80)   NULL,
  zone              ENUM('indoor','outdoor','both') NULL,
  light_level       ENUM('low','medium','high')     NULL,
  description       TEXT          NULL,
  image_url         VARCHAR(500)  NULL,
  raw_payload       JSON          NULL,                 -- full upstream response
  last_fetched_at   DATETIME      NOT NULL,
  fetch_failed_at   DATETIME      NULL,
  created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                  ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_species_provider_ext (provider, external_id),
  KEY idx_species_common_name (common_name),
  KEY idx_species_filters (zone, light_level, difficulty),
  KEY idx_species_stale (last_fetched_at)
) ENGINE=InnoDB;

-- Child tables for cached lists (problems / tips). Optional —
-- populate only if you want to render them locally without an
-- API round-trip.
CREATE TABLE IF NOT EXISTS species_problems (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  species_id  CHAR(26)        NOT NULL,
  problem     VARCHAR(500)    NOT NULL,
  sort_order  INT             NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_sp_problems (species_id, sort_order),
  CONSTRAINT fk_sp_problems FOREIGN KEY (species_id)
    REFERENCES species_cache(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS species_tips (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  species_id  CHAR(26)        NOT NULL,
  tip         VARCHAR(500)    NOT NULL,
  sort_order  INT             NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_sp_tips (species_id, sort_order),
  CONSTRAINT fk_sp_tips FOREIGN KEY (species_id)
    REFERENCES species_cache(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
--  4. HEALTH ISSUES  (editorial content, managed in Admin)
-- ============================================================

CREATE TABLE IF NOT EXISTS health_issues (
  id          CHAR(26)    NOT NULL,
  slug        VARCHAR(64) NOT NULL,
  name        VARCHAR(120) NOT NULL,
  created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP
                          ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_health_slug (slug),
  UNIQUE KEY uq_health_name (name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS health_issue_causes (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  issue_id    CHAR(26)        NOT NULL,
  cause       VARCHAR(500)    NOT NULL,
  sort_order  INT             NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_hic (issue_id, sort_order),
  CONSTRAINT fk_hic FOREIGN KEY (issue_id)
    REFERENCES health_issues(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS health_issue_tips (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  issue_id    CHAR(26)        NOT NULL,
  tip         VARCHAR(500)    NOT NULL,
  sort_order  INT             NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_hit (issue_id, sort_order),
  CONSTRAINT fk_hit FOREIGN KEY (issue_id)
    REFERENCES health_issues(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
--  5. USER PLANTS
-- ============================================================

CREATE TABLE IF NOT EXISTS plants (
  id              CHAR(26)     NOT NULL,
  user_id         CHAR(26)     NOT NULL,
  species_id      CHAR(26)     NULL,                    -- FK into species_cache
  name            VARCHAR(120) NOT NULL,
  species_name    VARCHAR(200) NOT NULL,                -- display copy (denormalized)
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
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP,
  archived_at     DATETIME     NULL,
  PRIMARY KEY (id),
  KEY idx_plants_user_active  (user_id, archived_at),
  KEY idx_plants_user_health  (user_id, health),
  KEY idx_plants_next_task    (user_id, next_task_date),
  KEY idx_plants_species      (species_id),
  CONSTRAINT fk_plants_user    FOREIGN KEY (user_id)
    REFERENCES users(id)         ON DELETE CASCADE,
  CONSTRAINT fk_plants_species FOREIGN KEY (species_id)
    REFERENCES species_cache(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS plant_timeline (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  plant_id    CHAR(26)        NOT NULL,
  label       VARCHAR(200)    NOT NULL,
  event_date  DATE            NOT NULL,
  sort_order  INT             NOT NULL DEFAULT 0,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_timeline (plant_id, event_date),
  CONSTRAINT fk_timeline_plant FOREIGN KEY (plant_id)
    REFERENCES plants(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
--  6. TASKS
-- ============================================================

CREATE TABLE IF NOT EXISTS tasks (
  id            CHAR(26)     NOT NULL,
  user_id       CHAR(26)     NOT NULL,
  plant_id      CHAR(26)     NOT NULL,
  type          ENUM('Water','Fertilize','Prune','Repot','Clean','Check','Rotate') NOT NULL,
  task_date     DATE         NOT NULL,
  task_time     VARCHAR(20)  NOT NULL DEFAULT 'Anytime',
  status        ENUM('pending','completed','skipped','overdue') NOT NULL DEFAULT 'pending',
  priority      ENUM('low','medium','high')  NOT NULL DEFAULT 'medium',
  completed_at  DATETIME     NULL,
  notes         VARCHAR(500) NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                             ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tasks_user_date   (user_id, task_date, status),
  KEY idx_tasks_plant_date  (plant_id, task_date),
  KEY idx_tasks_status_due  (status, task_date),
  CONSTRAINT fk_tasks_user  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
  CONSTRAINT fk_tasks_plant FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
--  7. JOURNAL
-- ============================================================

CREATE TABLE IF NOT EXISTS journal_entries (
  id          CHAR(26)     NOT NULL,
  user_id     CHAR(26)     NOT NULL,
  plant_id    CHAR(26)     NULL,                        -- nullable: plant may be archived
  activity    VARCHAR(64)  NOT NULL,
  entry_date  DATE         NOT NULL,
  notes       TEXT         NULL,
  photo_url   VARCHAR(500) NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                           ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_journal_user_date  (user_id, entry_date),
  KEY idx_journal_plant_date (plant_id, entry_date),
  CONSTRAINT fk_journal_user  FOREIGN KEY (user_id)
    REFERENCES users(id)  ON DELETE CASCADE,
  CONSTRAINT fk_journal_plant FOREIGN KEY (plant_id)
    REFERENCES plants(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
--  8. NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id           CHAR(26)     NOT NULL,
  user_id      CHAR(26)     NOT NULL,
  icon         VARCHAR(16)  NOT NULL DEFAULT '🌱',
  text         VARCHAR(500) NOT NULL,
  notice_date  DATE         NOT NULL,
  is_read      TINYINT(1)   NOT NULL DEFAULT 0,
  read_at      DATETIME     NULL,
  page         VARCHAR(32)  NULL,
  plant_id     CHAR(26)     NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notif_user  (user_id, is_read, notice_date),
  CONSTRAINT fk_notif_user  FOREIGN KEY (user_id)
    REFERENCES users(id)  ON DELETE CASCADE,
  CONSTRAINT fk_notif_plant FOREIGN KEY (plant_id)
    REFERENCES plants(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
--  9. ACTIVITY FEED
-- ============================================================

CREATE TABLE IF NOT EXISTS activity_log (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      CHAR(26)        NOT NULL,
  text         VARCHAR(255)    NOT NULL,
  entity_type  VARCHAR(40)     NULL,                    -- 'plant' | 'task' | 'journal'
  entity_id    CHAR(26)        NULL,
  occurred_at  DATETIME        NOT NULL,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_activity_user (user_id, occurred_at),
  KEY idx_activity_entity (entity_type, entity_id),
  CONSTRAINT fk_activity_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 10. ADMIN
-- ============================================================

CREATE TABLE IF NOT EXISTS admin_reports (
  id            CHAR(26)     NOT NULL,
  user_id       CHAR(26)     NULL,                      -- submitter
  subject       VARCHAR(255) NOT NULL,
  detail        TEXT         NULL,
  status        ENUM('open','resolved','dismissed') NOT NULL DEFAULT 'open',
  resolved_by   CHAR(26)     NULL,
  resolved_at   DATETIME     NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                             ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_reports_status (status, created_at),
  CONSTRAINT fk_reports_user     FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_reports_resolver FOREIGN KEY (resolved_by)
    REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notification_templates (
  id             CHAR(26)     NOT NULL,
  slug           VARCHAR(64)  NOT NULL,
  name           VARCHAR(128) NOT NULL,
  trigger_event  VARCHAR(255) NOT NULL,
  body           TEXT         NOT NULL,
  locale         VARCHAR(10)  NOT NULL DEFAULT 'en',
  is_active      TINYINT(1)   NOT NULL DEFAULT 1,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                              ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tpl_slug_locale (slug, locale)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS system_settings (
  setting_key  VARCHAR(64)  NOT NULL,
  setting_val  TEXT         NOT NULL,
  updated_by   CHAR(26)     NULL,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                            ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_key),
  CONSTRAINT fk_settings_updater FOREIGN KEY (updated_by)
    REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- 11. AUDIT (append-only)
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  actor_id     CHAR(26)        NULL,
  action       VARCHAR(64)     NOT NULL,                -- 'plant.create', 'user.login', ...
  entity_type  VARCHAR(40)     NULL,
  entity_id    CHAR(26)        NULL,
  metadata     JSON            NULL,
  ip_address   VARBINARY(16)   NULL,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_actor  (actor_id, created_at),
  KEY idx_audit_entity (entity_type, entity_id),
  KEY idx_audit_action (action, created_at)
) ENGINE=InnoDB;

-- ============================================================
--  VIEWS
-- ============================================================

CREATE OR REPLACE VIEW v_plant_overview AS
SELECT
  p.id,
  p.user_id,
  p.name,
  p.species_name,
  p.location,
  p.health,
  p.zone,
  p.last_watered,
  p.next_task_type,
  p.next_task_date,
  sc.common_name       AS library_name,
  sc.provider          AS library_provider,
  (SELECT COUNT(*) FROM tasks t
     WHERE t.plant_id = p.id AND t.status = 'pending')       AS pending_tasks,
  (SELECT COUNT(*) FROM journal_entries j
     WHERE j.plant_id = p.id)                                AS journal_count
FROM plants p
LEFT JOIN species_cache sc ON sc.id = p.species_id
WHERE p.archived_at IS NULL;

CREATE OR REPLACE VIEW v_task_feed AS
SELECT
  t.id,
  t.user_id,
  t.plant_id,
  p.name AS plant_name,
  t.type,
  t.task_date,
  t.task_time,
  t.status,
  t.priority,
  CASE
    WHEN t.status = 'completed'            THEN 'completed'
    WHEN t.task_date < CURDATE()           THEN 'overdue'
    WHEN t.task_date = CURDATE()           THEN 'today'
    ELSE 'upcoming'
  END AS display_status
FROM tasks t
JOIN plants p ON p.id = t.plant_id
WHERE p.archived_at IS NULL;

-- ============================================================
--  END
-- ============================================================