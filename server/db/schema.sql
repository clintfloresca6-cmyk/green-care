-- ============================================================
--  GreenCare — MySQL Schema + Seed Data
--  Target: XAMPP (MariaDB 10.4+), MySQL 5.7+, MySQL 8.0+
--  Charset: utf8mb4 / utf8mb4_unicode_ci   Engine: InnoDB
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS greencare
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE greencare;

-- ============================================================
--  1. AUTH
-- ============================================================

DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id           VARCHAR(32)  NOT NULL,
  name         VARCHAR(120) NOT NULL,
  email        VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,          -- plaintext for demo; swap for bcrypt/argon2 in Phase 6
  role         ENUM('user','admin','moderator') NOT NULL DEFAULT 'user',
  photo_url    VARCHAR(500)   NULL,
  location     VARCHAR(160) NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS user_settings;
CREATE TABLE user_settings (
  user_id            VARCHAR(32) NOT NULL,
  care_reminders     TINYINT(1)  NOT NULL DEFAULT 1,
  overdue_reminders  TINYINT(1)  NOT NULL DEFAULT 1,
  health_alerts      TINYINT(1)  NOT NULL DEFAULT 1,
  browser_notifs     TINYINT(1)  NOT NULL DEFAULT 0,
  theme              ENUM('light','dark') NOT NULL DEFAULT 'light',
  reminder_time      TIME        NOT NULL DEFAULT '08:00:00',
  week_start         ENUM('mon','sun')    NOT NULL DEFAULT 'mon',
  updated_at         DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_settings_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
--  2. SPECIES LIBRARY  (global reference data)
-- ============================================================

DROP TABLE IF EXISTS species;
CREATE TABLE species (
  id             VARCHAR(32)  NOT NULL,
  common_name    VARCHAR(160) NOT NULL,
  scientific_name VARCHAR(190) NOT NULL,
  difficulty     ENUM('Beginner','Intermediate','Advanced') NOT NULL DEFAULT 'Beginner',
  light          VARCHAR(80)  NOT NULL,
  watering       VARCHAR(80)  NOT NULL,
  fertilizing    VARCHAR(80)  NOT NULL,
  zone           ENUM('indoor','outdoor') NOT NULL DEFAULT 'indoor',
  light_level    ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
  description    TEXT         NULL,
  photo_url      VARCHAR(500) NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_species_common (common_name),
  KEY idx_species_zone   (zone, light_level, difficulty)
) ENGINE=InnoDB;

-- Species cache for faster lookups (matches species table structure)
DROP TABLE IF EXISTS species_cache;
CREATE TABLE species_cache (
  id             VARCHAR(32)  NOT NULL,
  common_name    VARCHAR(160) NOT NULL,
  scientific_name VARCHAR(190) NOT NULL,
  difficulty     ENUM('Beginner','Intermediate','Advanced') NOT NULL DEFAULT 'Beginner',
  light          VARCHAR(80)  NOT NULL,
  watering       VARCHAR(80)  NOT NULL,
  fertilizing    VARCHAR(80)  NOT NULL,
  zone           ENUM('indoor','outdoor') NOT NULL DEFAULT 'indoor',
  light_level    ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
  description    TEXT         NULL,
  photo_url      VARCHAR(500) NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_species_common (common_name),
  KEY idx_species_zone   (zone, light_level, difficulty)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS species_problems;
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

DROP TABLE IF EXISTS species_tips;
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

-- ============================================================
--  3. HEALTH ISSUES  (Common Issues panel reference data)
-- ============================================================

DROP TABLE IF EXISTS health_issues;
CREATE TABLE health_issues (
  id          VARCHAR(48)  NOT NULL,
  name        VARCHAR(80)  NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_health_issue_name (name)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS health_issue_causes;
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

DROP TABLE IF EXISTS health_issue_tips;
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

-- ============================================================
--  4. USER PLANTS
-- ============================================================

DROP TABLE IF EXISTS plants;
CREATE TABLE plants (
  id              VARCHAR(32)  NOT NULL,
  user_id         VARCHAR(32)  NOT NULL,
  species_id      VARCHAR(32)  NULL,                    -- optional FK to species_cache
  name            VARCHAR(120) NOT NULL,
  species_name    VARCHAR(160) NOT NULL,                -- denormalized display name
  location        VARCHAR(160) NULL,
  zone            ENUM('indoor','outdoor') NOT NULL DEFAULT 'indoor',
  light           VARCHAR(80)  NOT NULL,
  watering        VARCHAR(80)  NOT NULL,
  fertilizing     VARCHAR(80)  NOT NULL,
  health          ENUM('Healthy','Good','Needs Attention','Critical') NOT NULL DEFAULT 'Good',
  last_watered    DATE         NULL,
  next_task_type  ENUM('Water','Fertilize','Prune','Repot','Clean','Check','Rotate') NULL,
  next_task_date  DATE         NULL,
  notes           TEXT         NULL,
  photo_url       VARCHAR(500) NULL,
  added_at        DATE         NULL,
  archived_at     DATETIME     NULL,                    -- when plant was archived (soft delete)
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_plants_user      (user_id, archived_at),
  KEY idx_plants_health    (health),
  KEY idx_plants_species   (species_id),
  CONSTRAINT fk_plants_user    FOREIGN KEY (user_id)    REFERENCES users(id)   ON DELETE CASCADE,
  CONSTRAINT fk_plants_species FOREIGN KEY (species_id) REFERENCES species_cache(id) ON DELETE SET NULL
) ENGINE=InnoDB;

DROP TABLE IF EXISTS plant_timeline;
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

-- ============================================================
--  5. TASKS  (Care Schedule)
-- ============================================================

DROP TABLE IF EXISTS tasks;
CREATE TABLE tasks (
  id           VARCHAR(32)  NOT NULL,
  user_id      VARCHAR(32)  NOT NULL,
  plant_id     VARCHAR(32)  NOT NULL,
  type         ENUM('Water','Fertilize','Prune','Repot','Clean','Check','Rotate') NOT NULL,
  task_date    DATE         NOT NULL,
  task_time    VARCHAR(20)  NOT NULL DEFAULT 'Anytime',   -- '8:00 AM' | 'Anytime'
  status       ENUM('pending','completed','overdue') NOT NULL DEFAULT 'pending',
  priority     ENUM('low','medium','high')           NOT NULL DEFAULT 'medium',
  completed_at DATETIME     NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tasks_user_date (user_id, task_date),
  KEY idx_tasks_plant     (plant_id),
  KEY idx_tasks_status    (status, task_date),
  CONSTRAINT fk_tasks_user  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
  CONSTRAINT fk_tasks_plant FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
--  6. JOURNAL
-- ============================================================

DROP TABLE IF EXISTS journal_entries;
CREATE TABLE journal_entries (
  id           VARCHAR(32)  NOT NULL,
  user_id      VARCHAR(32)  NOT NULL,
  plant_id     VARCHAR(32)  NULL,
  activity     VARCHAR(64)  NOT NULL,
  entry_date   DATE         NOT NULL,
  notes        TEXT         NULL,
  photo_url    VARCHAR(500) NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_journal_user_date (user_id, entry_date),
  KEY idx_journal_plant     (plant_id),
  CONSTRAINT fk_journal_user  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
  CONSTRAINT fk_journal_plant FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
--  7. NOTIFICATIONS
-- ============================================================

DROP TABLE IF EXISTS notifications;
CREATE TABLE notifications (
  id           VARCHAR(32)  NOT NULL,
  user_id      VARCHAR(32)  NOT NULL,
  icon         VARCHAR(16)  NOT NULL DEFAULT '🌱',
  text         VARCHAR(500) NOT NULL,
  notice_date  DATE         NOT NULL,
  is_read      TINYINT(1)   NOT NULL DEFAULT 0,
  read_at      DATETIME     NULL,
  page         VARCHAR(32)  NULL,       -- 'plants' | 'health' | 'schedule' | 'reports'
  plant_id     VARCHAR(32)  NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notif_user (user_id, is_read, notice_date),
  CONSTRAINT fk_notif_user  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
  CONSTRAINT fk_notif_plant FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
--  8. ACTIVITY FEED  (Dashboard “Recent Activity”)
-- ============================================================

DROP TABLE IF EXISTS activity_log;
CREATE TABLE activity_log (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      VARCHAR(32)     NOT NULL,
  text         VARCHAR(255)    NOT NULL,
  occurred_at  DATETIME        NOT NULL,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_activity_user (user_id, occurred_at),
  CONSTRAINT fk_activity_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
--  9. ADMIN PANEL
-- ============================================================

DROP TABLE IF EXISTS admin_reports;
CREATE TABLE admin_reports (
  id           VARCHAR(32)  NOT NULL,
  user_id      VARCHAR(32)  NULL,                -- submitter, null for system-generated
  subject      VARCHAR(255) NOT NULL,
  detail       TEXT         NULL,
  status       ENUM('open','resolved','dismissed') NOT NULL DEFAULT 'open',
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at  DATETIME     NULL,
  PRIMARY KEY (id),
  KEY idx_reports_status (status, created_at),
  CONSTRAINT fk_reports_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

DROP TABLE IF EXISTS notification_templates;
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

DROP TABLE IF EXISTS system_settings;
CREATE TABLE system_settings (
  setting_key  VARCHAR(64)  NOT NULL,
  setting_val  VARCHAR(255) NOT NULL,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB;

-- ============================================================
--  SESSIONS
-- ============================================================

DROP TABLE IF EXISTS sessions;
CREATE TABLE sessions (
  session_id VARCHAR(128) NOT NULL,
  expires DATETIME NOT NULL,
  data TEXT NULL,
  PRIMARY KEY (session_id)
) ENGINE=InnoDB;

-- ============================================================
--  SEED DATA
-- ============================================================

-- ── Users ───────────────────────────────────────────────────
INSERT INTO users (id, name, email, password_hash, role, location) VALUES
  ('u_admin', 'Admin User',     'admin@greencare.app', 'admin123', 'admin', NULL),
  ('u_user',  'Jane Botanist',  'user@greencare.app',  'user123',  'user',  NULL);

INSERT INTO user_settings (user_id) VALUES ('u_admin'), ('u_user');

-- ── Species library ─────────────────────────────────────────
INSERT INTO species
  (id, common_name, scientific_name, difficulty, light, watering, fertilizing, zone, light_level, description, photo_url) VALUES
  ('s1', 'Monstera Deliciosa', 'Monstera deliciosa',       'Beginner',     'Bright Indirect',      'Weekly',            'Monthly during growing season', 'indoor',  'medium', 'A fast-growing tropical climber known for its dramatic split leaves. Thrives with something to climb on.', NULL),
  ('s2', 'Snake Plant',        'Dracaena trifasciata',     'Beginner',     'Low to Bright Indirect','Every 2-3 weeks',   'Every 2 months',                'indoor',  'low',    'An upright, sculptural plant that tolerates neglect and low light exceptionally well.', NULL),
  ('s3', 'Aloe Vera',          'Aloe barbadensis miller',  'Beginner',     'Full Sun',             'Every 2-3 weeks',   'Seasonal, light feeding',       'outdoor', 'medium', 'A succulent prized for its soothing gel and easygoing care needs.', NULL),
  ('s4', 'Pothos',             'Epipremnum aureum',        'Beginner',     'Low to Medium Light',  'Weekly',            'Monthly',                       'indoor',  'low',    'A trailing vine that adapts to almost any indoor condition, a favorite first plant.', NULL),
  ('s5', 'Peace Lily',         'Spathiphyllum wallisii',   'Intermediate', 'Medium Light',         'Weekly',            'Every 6 weeks',                 'indoor',  'medium', 'An elegant flowering houseplant that dramatically droops to signal thirst.', NULL),
  ('s6', 'Basil',              'Ocimum basilicum',         'Beginner',     'Full Sun',             'Every 2-3 days',    'Every 2 weeks',                 'indoor',  'medium', 'A fragrant culinary herb that rewards frequent harvesting with bushier growth.', NULL),
  ('s7', 'Spider Plant',       'Chlorophytum comosum',     'Beginner',     'Bright Indirect',      'Every 7-10 days',   'Monthly',                       'indoor',  'medium', 'A resilient plant that produces charming plantlets on long stems.', NULL),
  ('s8', 'English Ivy',        'Hedera helix',             'Intermediate', 'Medium Light',         'Weekly',            'Monthly',                       'indoor',  'medium', 'A classic trailing vine that enjoys cooler, humid rooms like bathrooms.', NULL);

-- Populate species_cache with data from species
INSERT INTO species_cache
SELECT * FROM species;

INSERT INTO species_problems (species_id, problem, sort_order) VALUES
  ('s1','Yellow leaves from overwatering',1),
  ('s1','Brown crispy edges from low humidity',2),
  ('s1','Small, unsplit leaves from insufficient light',3),
  ('s2','Root rot from overwatering',1),
  ('s2','Wrinkled leaves from underwatering',2),
  ('s3','Mushy leaves from overwatering',1),
  ('s3','Thin, curling leaves from underwatering',2),
  ('s4','Yellow leaves from overwatering',1),
  ('s4','Leggy vines from insufficient light',2),
  ('s5','Drooping from underwatering',1),
  ('s5','Brown tips from tap water minerals or low humidity',2),
  ('s6','Wilting in heat or dry soil',1),
  ('s6','Yellow leaves from overwatering or nutrient deficiency',2),
  ('s7','Brown tips from fluoride/chlorine in tap water',1),
  ('s7','Pale leaves from too much direct sun',2),
  ('s8','Spider mites in dry air',1),
  ('s8','Yellowing from overwatering',2);

INSERT INTO species_tips (species_id, tip, sort_order) VALUES
  ('s1','Water when the top 2 inches of soil are dry',1),
  ('s1','Wipe leaves to keep them dust-free',2),
  ('s1','Provide a moss pole for climbing',3),
  ('s2','Let soil dry out completely between waterings',1),
  ('s2','Avoid cold drafts',2),
  ('s2','Use well-draining, sandy soil',3),
  ('s3','Use a cactus/succulent soil mix',1),
  ('s3','Water deeply, then let dry fully',2),
  ('s3','Give at least 6 hours of sun',3),
  ('s4','Let soil dry between waterings',1),
  ('s4','Trim regularly to encourage fullness',2),
  ('s4','Propagates easily in water',3),
  ('s5','Water as soon as leaves start to droop',1),
  ('s5','Use filtered or rested water',2),
  ('s5','Keep away from cold drafts',3),
  ('s6','Keep soil consistently moist, not soggy',1),
  ('s6','Pinch off flower buds to prolong leaf production',2),
  ('s6','Harvest from the top down',3),
  ('s7','Use distilled or rain water if possible',1),
  ('s7','Remove plantlets to propagate new plants',2),
  ('s7','Trim brown tips with clean scissors',3),
  ('s8','Mist regularly or use a humidity tray',1),
  ('s8','Prune to prevent legginess',2),
  ('s8','Check leaf undersides for pests',3);

-- ── Common health issues ────────────────────────────────────
INSERT INTO health_issues (id, name) VALUES
  ('yellow_leaves','Yellow Leaves'),
  ('wilting',      'Wilting'),
  ('pests',        'Pests'),
  ('brown_leaves', 'Brown Leaves'),
  ('overwatering', 'Overwatering'),
  ('underwatering','Underwatering');

INSERT INTO health_issue_causes (issue_id, cause, sort_order) VALUES
  ('yellow_leaves','Overwatering',1),
  ('yellow_leaves','Insufficient light',2),
  ('yellow_leaves','Nutrient deficiency',3),
  ('wilting','Underwatering',1),
  ('wilting','Root stress',2),
  ('wilting','Heat exposure',3),
  ('pests','Poor air circulation',1),
  ('pets','Overwatering',2),
  ('pets','Nearby infested plants',3),
  ('brown_leaves','Low humidity',1),
  ('brown_leaves','Mineral buildup from tap water',2),
  ('brown_leaves','Sunburn',3),
  ('overwatering','Watering on a fixed schedule',1),
  ('overwatering','Poor drainage',2),
  ('overwatering','Pot without drainage holes',3),
  ('underwatering','Forgetting scheduled waterings',1),
  ('underwatering','Fast-draining soil mix',2),
  ('underwatering','Low humidity environment',3);

INSERT INTO health_issue_tips (issue_id, tip, sort_order) VALUES
  ('yellow_leaves','Check soil moisture before watering again',1),
  ('yellow_leaves','Review watering frequency',2),
  ('yellow_leaves','Move the plant to appropriate lighting',3),
  ('wilting','Water thoroughly and check drainage',1),
  ('wilting','Move away from direct heat sources',2),
  ('wilting',"Check roots aren't bound or rotting",3),
  ('pets','Isolate the affected plant',1),
  ('pets','Wipe leaves with diluted neem oil',2),
  ('pets','Improve airflow around the plant',3),
  ('brown_leaves','Increase humidity with a tray or misting',1),
  ('brown_leaves','Use filtered or rested water',2),
  ('brown_leaves','Move out of direct harsh sun',3),
  ('overwatering','Let soil dry before watering again',1),
  ('overwatering','Ensure pots have drainage holes',2),
  ('overwatering','Repot in well-draining soil if needed',3),
  ('underwatering','Set reminders for consistent watering',1),
  ('underwatering','Water deeply until it drains out the bottom',2),
  ('underwatering','Group plants to raise local humidity',3);

-- ── User plants (owned by the demo regular user) ────────────
INSERT INTO plants
  (id, user_id, species_id, name, species_name, location, zone, light, watering, fertilizing,
   health, last_watered, next_task_type, next_task_date, notes, added_at, archived_at) VALUES
  ('p1','u_user','s1','Luna',   'Monstera Deliciosa','Living Room Window','indoor', 'Bright Indirect','Weekly',          'Monthly',          'Good',           CURDATE() - INTERVAL 4 DAY,  'Water',     CURDATE() + INTERVAL 1 DAY,  'Loves the morning light by the window.',          CURDATE() - INTERVAL 60 DAY, NULL),
  ('p2','u_user','s6','Basil',  'Ocimum Basilicum',  'Kitchen Sill',      'indoor', 'Full Sun',       'Every 3 days',    'Every 2 weeks',    'Needs Attention',CURDATE() - INTERVAL 3 DAY,  'Fertilize', CURDATE(),                   'Wilting a little after the heat wave.',           CURDATE() - INTERVAL 40 DAY, NULL),
  ('p3','u_user','s3','Sunny',  'Aloe Vera',         'Balcony',           'outdoor','Full Sun',       'Every 2 weeks',   'Seasonal',         'Healthy',        CURDATE() - INTERVAL 9 DAY,  'Water',     CURDATE() + INTERVAL 4 DAY,  'Very low maintenance, thriving.',                 CURDATE() - INTERVAL 120 DAY, NULL),
  ('p4','u_user','s2','Spike',  'Snake Plant',       'Hallway Corner',    'indoor', 'Low Light',      'Every 2 weeks',   'Every 6 weeks',    'Healthy',        CURDATE() - INTERVAL 11 DAY, 'Check',     CURDATE() + INTERVAL 2 DAY,  'Barely needs anything, great starter plant.',     CURDATE() - INTERVAL 200 DAY, NULL),
  ('p5','u_user','s8','Ivy',    'English Ivy',       'Bathroom Shelf',    'indoor', 'Medium Light',   'Weekly',          'Monthly',          'Good',           CURDATE() - INTERVAL 5 DAY,  'Water',     CURDATE() + INTERVAL 2 DAY,  'Enjoys the humidity in here.',                    CURDATE() - INTERVAL 75 DAY, NULL),
  ('p6','u_user','s6','Minty',  'Mint',              'Kitchen Sill',      'indoor', 'Bright Indirect','Every 3 days',    'Every 2 weeks',    'Healthy',        CURDATE() - INTERVAL 2 DAY,  'Water',     CURDATE() + INTERVAL 1 DAY,  'Growing fast, might need repotting soon.',        CURDATE() - INTERVAL 30 DAY, NULL),
  ('p7','u_user','s4','Percy',  'Pothos',            'Office Desk',       'indoor', 'Low Light',      'Weekly',          'Monthly',          'Good',           CURDATE() - INTERVAL 6 DAY,  'Water',     CURDATE() + INTERVAL 1 DAY,  'Trailing nicely along the shelf.',                CURDATE() - INTERVAL 55 DAY, NULL),
  ('p8','u_user','s5','Lily',   'Peace Lily',        'Bedroom',           'indoor', 'Medium Light',   'Weekly',          'Every 6 weeks',    'Needs Attention',CURDATE() - INTERVAL 8 DAY,  'Water',     CURDATE() - INTERVAL 1 DAY,  'Drooping; likely overdue for water.',             CURDATE() - INTERVAL 95 DAY, NULL),
  ('p9','u_user','s7','Webster','Spider Plant',      'Balcony',           'outdoor','Bright Indirect','Every 10 days',   'Monthly',          'Healthy',        CURDATE() - INTERVAL 3 DAY,  'Water',     CURDATE() + INTERVAL 6 DAY,  'Sending out new babies.',                         CURDATE() - INTERVAL 140 DAY, NULL),
  ('p10','u_user','s1','Coco',  'Monstera Deliciosa','Reading Nook',      'indoor', 'Bright Indirect','Weekly',          'Monthly',          'Good',           CURDATE() - INTERVAL 4 DAY,  'Rotate',    CURDATE() + INTERVAL 1 DAY,  'Rotate weekly for even growth.',                  CURDATE() - INTERVAL 50 DAY, NULL);

INSERT INTO plant_timeline (plant_id, label, event_date, sort_order) VALUES
  ('p1','Plant added',                    CURDATE() - INTERVAL 60 DAY,1),
  ('p1','First watering',                 CURDATE() - INTERVAL 58 DAY,2),
  ('p1','New leaf observed',              CURDATE() - INTERVAL 1 DAY, 3),
  ('p2','Plant added',                    CURDATE() - INTERVAL 40 DAY,1),
  ('p2','First watering',                 CURDATE() - INTERVAL 38 DAY,2),
  ('p2','Health updated',                 CURDATE() - INTERVAL 2 DAY, 3),
  ('p8','Plant added',                    CURDATE() - INTERVAL 95 DAY,1),
  ('p8','First watering',                 CURDATE() - INTERVAL 93 DAY,2),
  ('p8','Health updated',                 CURDATE() - INTERVAL 3 DAY, 3),
  ('p9','Plant added',                    CURDATE() - INTERVAL 140 DAY,1),
  ('p9','First watering',                 CURDATE() - INTERVAL 138 DAY,2),
  ('p9','New leaf observed',              CURDATE() - INTERVAL 4 DAY, 3);

-- ── Tasks ───────────────────────────────────────────────────
INSERT INTO tasks (id, user_id, plant_id, type, task_date, task_time, status, priority) VALUES
  ('t1','u_user','p1','Water',    CURDATE(),                    '8:00 AM', 'pending',  'medium'),
  ('t2','u_user','p2','Fertilize',CURDATE(),                    '9:00 AM', 'pending',  'high'),
  ('t3','u_user','p4','Check',    CURDATE(),                    'Anytime', 'pending',  'low'),
  ('t4','u_user','p7','Rotate',   CURDATE(),                    'Anytime', 'pending',  'low'),
  ('t5','u_user','p8','Water',    CURDATE() - INTERVAL 1 DAY,   '8:00 AM', 'overdue',  'high'),
  ('t6','u_user','p3','Water',    CURDATE() + INTERVAL 4 DAY,   '8:00 AM', 'pending',  'low'),
  ('t7','u_user','p5','Water',    CURDATE() + INTERVAL 2 DAY,   '8:00 AM', 'pending',  'medium'),
  ('t8','u_user','p6','Water',    CURDATE() + INTERVAL 1 DAY,   '8:00 AM', 'pending',  'medium'),
  ('t9','u_user','p9','Water',    CURDATE() + INTERVAL 6 DAY,   '8:00 AM', 'pending',  'low'),
  ('t10','u_user','p10','Rotate', CURDATE() + INTERVAL 1 DAY,   'Anytime', 'pending',  'low'),
  ('t11','u_user','p1','Fertilize',CURDATE() + INTERVAL 12 DAY, '9:00 AM', 'pending',  'low'),
  ('t12','u_user','p4','Fertilize',CURDATE() + INTERVAL 20 DAY, '9:00 AM', 'pending',  'low'),
  ('t13','u_user','p2','Water',    CURDATE() - INTERVAL 2 DAY,  '8:00 AM', 'completed','medium'),
  ('t14','u_user','p1','Water',    CURDATE() - INTERVAL 4 DAY,  '8:00 AM', 'completed','medium'),
  ('t15','u_user','p5','Fertilize',CURDATE() - INTERVAL 6 DAY,  '9:00 AM', 'completed','low'),
  ('t16','u_user','p7','Water',    CURDATE() - INTERVAL 6 DAY,  '8:00 AM', 'completed','medium'),
  ('t17','u_user','p8','Prune',    CURDATE() - INTERVAL 10 DAY, 'Anytime', 'completed','low'),
  ('t18','u_user','p3','Fertilize',CURDATE() - INTERVAL 15 DAY, '9:00 AM', 'completed','low');

-- ── Journal ─────────────────────────────────────────────────
INSERT INTO journal_entries (id, user_id, plant_id, activity, entry_date, notes) VALUES
  ('j1', 'u_user','p1','Watered',       CURDATE() - INTERVAL 4 DAY, 'Leaves appear healthy and upright.'),
  ('j2', 'u_user','p4','Checked Health',CURDATE() - INTERVAL 15 DAY,'No changes, still doing great.'),
  ('j3', 'u_user','p2','Fertilized',    CURDATE() - INTERVAL 6 DAY, 'Added diluted liquid fertilizer.'),
  ('j4', 'u_user','p3','Checked Health',CURDATE() - INTERVAL 20 DAY,'Updated Aloe Vera health status to Healthy.'),
  ('j5', 'u_user','p4','Other',         CURDATE() - INTERVAL 10 DAY,'Added note to Snake Plant about slow but steady growth.'),
  ('j6', 'u_user','p8','Checked Health',CURDATE() - INTERVAL 1 DAY, 'Leaves drooping, moved up next watering.'),
  ('j7', 'u_user','p6','Pruned',        CURDATE() - INTERVAL 8 DAY, 'Trimmed back leggy stems.'),
  ('j8', 'u_user','p9','Repotted',      CURDATE() - INTERVAL 25 DAY,'Moved to a slightly bigger pot, roots were crowded.'),
  ('j9', 'u_user','p7','Cleaned',       CURDATE() - INTERVAL 12 DAY,'Wiped dust off the leaves.'),
  ('j10','u_user','p10','Watered',      CURDATE() - INTERVAL 4 DAY, 'Soil was fully dry, gave a deep water.'),
  ('j11','u_user','p5','Fertilized',    CURDATE() - INTERVAL 6 DAY, 'Light feeding before the humid season.'),
  ('j12','u_user','p2','Checked Health',CURDATE() - INTERVAL 2 DAY, 'Noticed slight wilting, watching closely.');

-- ── Notifications ───────────────────────────────────────────
INSERT INTO notifications (id, user_id, icon, text, notice_date, is_read, page, plant_id) VALUES
  ('n1','u_user','🌱','Luna needs watering today.',                    CURDATE(),                   0,'plants','p1'),
  ('n2','u_user','🌿','Basil fertilizer is due today.',                CURDATE(),                   0,'plants','p2'),
  ('n3','u_user','⚠','Peace Lily watering is overdue.',               CURDATE() - INTERVAL 1 DAY,  0,'plants','p8'),
  ('n4','u_user','🪴',"Snake Plant hasn't been checked recently.",    CURDATE() - INTERVAL 1 DAY,  0,'plants','p4'),
  ('n5','u_user','✂','Mint may need pruning soon; growing quickly.',  CURDATE() - INTERVAL 3 DAY,  1,'plants','p6'),
  ('n6','u_user','🌸','Peace Lily is showing signs it needs attention.',CURDATE() - INTERVAL 1 DAY,0,'health',NULL),
  ('n7','u_user','🌾','Spider Plant produced new offshoots.',         CURDATE() - INTERVAL 25 DAY, 1,'plants','p9'),
  ('n8','u_user','🪴','Aloe Vera watering is coming up in 4 days.',   CURDATE(),                   1,'schedule',NULL),
  ('n9','u_user','🌿','Weekly care summary is ready in Reports.',     CURDATE() - INTERVAL 2 DAY,  1,'reports',NULL);

-- ── Activity feed ───────────────────────────────────────────
INSERT INTO activity_log (user_id, text, occurred_at) VALUES
  ('u_user','Watered Luna',              TIMESTAMP(CURDATE() - INTERVAL 4 DAY,  '08:02:00')),
  ('u_user','Added note to Snake Plant', TIMESTAMP(CURDATE() - INTERVAL 10 DAY, '18:40:00')),
  ('u_user','Fertilized Basil',          TIMESTAMP(CURDATE() - INTERVAL 6 DAY,  '09:15:00')),
  ('u_user','Updated Aloe Vera health',  TIMESTAMP(CURDATE() - INTERVAL 20 DAY, '19:30:00')),
  ('u_user','Repotted Spider Plant',     TIMESTAMP(CURDATE() - INTERVAL 25 DAY, '11:00:00'));

-- ── Admin reports ───────────────────────────────────────────
INSERT INTO admin_reports (id, subject, detail, status) VALUES
  ('r1','Incorrect plant information','Watering frequency for Peace Lily looks too frequent.','open'),
  ('r2','Diagnosis result feedback','Diagnosis suggested overwatering but plant was underwatered.','open'),
  ('r3','Incorrect plant information',"Snake Plant listed as 'Low Light' should include 'Bright Indirect' too.",'resolved'),
  ('r4','Diagnosis result feedback','Confidence score seemed too high for a blurry photo.','dismissed');

-- ── Notification templates ──────────────────────────────────
INSERT INTO notification_templates (id, name, trigger_event, body) VALUES
  ('tpl_water','Watering Reminder',   'On scheduled watering day',   '🌱 {plant} needs watering today.'),
  ('tpl_fert', 'Fertilizing Reminder','On scheduled fertilizing day', '🌿 {plant} fertilizer is due {date}.'),
  ('tpl_over', 'Overdue Alert',       'When task is overdue',         '⚠ {plant} has not been checked recently.'),
  ('tpl_health','Health Alert',       'On health status change',      '{plant} is showing signs it needs attention.');

-- ── System settings ─────────────────────────────────────────
INSERT INTO system_settings (setting_key, setting_val) VALUES
  ('allow_registration','1'),
  ('diagnosis_feature','1'),
  ('weekly_report_email','0');

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
--  OPTIONAL: handy views
-- ============================================================

CREATE OR REPLACE VIEW v_plant_overview AS
SELECT
  p.id, p.user_id, p.name, p.species_name, p.location,
  p.health, p.zone,
  p.last_watered, p.next_task_type, p.next_task_date,
  s.common_name AS library_name,
  (SELECT COUNT(*) FROM tasks t     WHERE t.plant_id = p.id AND t.status = 'pending')   AS pending_tasks,
  (SELECT COUNT(*) FROM journal_entries j WHERE j.plant_id = p.id)                       AS journal_count
FROM plants p
LEFT JOIN species_cache s ON s.id = p.species_id
WHERE p.archived_at IS NULL;

CREATE OR REPLACE VIEW v_task_feed AS
SELECT
  t.id, t.user_id, t.plant_id, p.name AS plant_name,
  t.type, t.task_date, t.task_time, t.status, t.priority
FROM tasks t
JOIN plants p ON p.id = t.plant_id
ORDER BY t.task_date, t.task_time;

-- ============================================================
--  END
-- ============================================================