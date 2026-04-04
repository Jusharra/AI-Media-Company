/**
 * SIGNAL Database Initialization Script
 *
 * Creates all SQLite databases and tables for the 8-agent pipeline.
 * Run once before starting the system: npx ts-node src/lib/init-db.ts
 *
 * Databases created:
 *   data/signal-scout.db     — Scout entities + intake queue
 *   data/interview.db        — Interview sessions + transcripts
 *   data/backgrounder.db     — Research profiles + source data
 *   data/journalist.db       — Content drafts + article versions
 *   data/media-producer.db   — Media packages + social content
 *   data/validator.db        — Validation reports + scores
 *   data/distributor.db      — Distribution jobs + analytics
 *   data/lead.db             — Pipeline orchestration + sessions
 *   data/admin.db            — Admin users + sessions (dashboard auth)
 */

import Database from 'better-sqlite3';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log(`Created data directory: ${DATA_DIR}`);
  }
}

function dbPath(name: string) {
  return path.join(DATA_DIR, `${name}.db`);
}

function openDb(name: string): Database.Database {
  const db = new Database(dbPath(name));
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

// ─────────────────────────────────────────────
// SHARED: Agent Messaging Tables
// Every agent DB gets these two tables
// ─────────────────────────────────────────────
function createMessagingTables(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages_in (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      from_agent  TEXT    NOT NULL,
      to_agent    TEXT    NOT NULL,
      task_id     TEXT    NOT NULL,
      type        TEXT    NOT NULL,
      payload     TEXT    NOT NULL DEFAULT '{}',
      status      TEXT    NOT NULL DEFAULT 'pending',
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      processed_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_messages_in_task_id  ON messages_in(task_id);
    CREATE INDEX IF NOT EXISTS idx_messages_in_status   ON messages_in(status);

    CREATE TABLE IF NOT EXISTS messages_out (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      from_agent  TEXT    NOT NULL,
      to_agent    TEXT    NOT NULL,
      task_id     TEXT    NOT NULL,
      type        TEXT    NOT NULL,
      payload     TEXT    NOT NULL DEFAULT '{}',
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_messages_out_task_id ON messages_out(task_id);
  `);
}

// ─────────────────────────────────────────────
// 1. SIGNAL SCOUT DB
// ─────────────────────────────────────────────
function initSignalScout() {
  const db = openDb('signal-scout');
  createMessagingTables(db);

  db.exec(`
    CREATE TABLE IF NOT EXISTS entities (
      id              TEXT    PRIMARY KEY,
      name            TEXT    NOT NULL,
      email           TEXT,
      company         TEXT    NOT NULL,
      title           TEXT,
      industry        TEXT    NOT NULL CHECK(industry IN ('healthcare','oil_gas','construction','other')),
      website         TEXT,
      linkedin_url    TEXT,
      hook            TEXT,
      notes           TEXT,
      source          TEXT    NOT NULL DEFAULT 'manual',
      status          TEXT    NOT NULL DEFAULT 'new' CHECK(status IN ('new','qualifying','qualified','rejected','featured')),
      confidence_score INTEGER DEFAULT 0,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_entities_status   ON entities(status);
    CREATE INDEX IF NOT EXISTS idx_entities_industry ON entities(industry);

    CREATE TABLE IF NOT EXISTS entity_sources (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_id   TEXT    NOT NULL REFERENCES entities(id),
      source_type TEXT    NOT NULL,
      source_url  TEXT,
      raw_data    TEXT,
      found_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pipeline_state (
      id              TEXT    PRIMARY KEY,
      entity_id       TEXT    NOT NULL REFERENCES entities(id),
      task_id         TEXT    NOT NULL UNIQUE,
      current_stage   TEXT    NOT NULL DEFAULT 'scouting',
      status          TEXT    NOT NULL DEFAULT 'active',
      gate_1_status   TEXT    DEFAULT 'pending',
      gate_2_status   TEXT    DEFAULT 'pending',
      gate_3_status   TEXT    DEFAULT 'pending',
      gate_4_status   TEXT    DEFAULT 'pending',
      gate_1_notes    TEXT,
      gate_2_notes    TEXT,
      gate_3_notes    TEXT,
      gate_4_notes    TEXT,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_pipeline_state_task_id   ON pipeline_state(task_id);
    CREATE INDEX IF NOT EXISTS idx_pipeline_state_status    ON pipeline_state(status);
  `);

  db.close();
  console.log('✓ signal-scout.db initialized');
}

// ─────────────────────────────────────────────
// 2. INTERVIEW ENGINE DB
// ─────────────────────────────────────────────
function initInterview() {
  const db = openDb('interview');
  createMessagingTables(db);

  db.exec(`
    CREATE TABLE IF NOT EXISTS interview_sessions (
      id              TEXT    PRIMARY KEY,
      task_id         TEXT    NOT NULL,
      entity_id       TEXT    NOT NULL,
      status          TEXT    NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','scheduled','in_progress','completed','failed')),
      interview_type  TEXT    NOT NULL DEFAULT 'async',
      vapi_call_id    TEXT,
      started_at      TEXT,
      completed_at    TEXT,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_task_id ON interview_sessions(task_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_status  ON interview_sessions(status);

    CREATE TABLE IF NOT EXISTS interview_questions (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id  TEXT    NOT NULL REFERENCES interview_sessions(id),
      category    TEXT    NOT NULL,
      question    TEXT    NOT NULL,
      answer      TEXT,
      asked_at    TEXT,
      answered_at TEXT
    );

    CREATE TABLE IF NOT EXISTS interview_transcripts (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id  TEXT    NOT NULL REFERENCES interview_sessions(id),
      role        TEXT    NOT NULL CHECK(role IN ('interviewer','subject')),
      content     TEXT    NOT NULL,
      timestamp   TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS interview_summaries (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id      TEXT    NOT NULL UNIQUE REFERENCES interview_sessions(id),
      key_themes      TEXT,
      strongest_hooks TEXT,
      credibility_signals TEXT,
      story_angles    TEXT,
      confidence_score INTEGER DEFAULT 0,
      raw_summary     TEXT,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.close();
  console.log('✓ interview.db initialized');
}

// ─────────────────────────────────────────────
// 3. BACKGROUNDER DB
// ─────────────────────────────────────────────
function initBackgrounder() {
  const db = openDb('backgrounder');
  createMessagingTables(db);

  db.exec(`
    CREATE TABLE IF NOT EXISTS research_profiles (
      id              TEXT    PRIMARY KEY,
      task_id         TEXT    NOT NULL,
      entity_id       TEXT    NOT NULL,
      founder_name    TEXT    NOT NULL,
      company_name    TEXT    NOT NULL,
      status          TEXT    NOT NULL DEFAULT 'in_progress',
      confidence_score INTEGER DEFAULT 0,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_research_task_id ON research_profiles(task_id);

    CREATE TABLE IF NOT EXISTS research_sources (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id      TEXT    NOT NULL REFERENCES research_profiles(id),
      source_type     TEXT    NOT NULL,
      source_url      TEXT,
      title           TEXT,
      content_summary TEXT,
      credibility_score INTEGER DEFAULT 50,
      found_at        TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS fact_checks (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id  TEXT    NOT NULL REFERENCES research_profiles(id),
      claim       TEXT    NOT NULL,
      verdict     TEXT    NOT NULL CHECK(verdict IN ('verified','unverified','false','disputed')),
      evidence    TEXT,
      source_url  TEXT,
      checked_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS industry_context (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id      TEXT    NOT NULL REFERENCES research_profiles(id),
      market_size     TEXT,
      key_competitors TEXT,
      regulatory_env  TEXT,
      macro_trends    TEXT,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.close();
  console.log('✓ backgrounder.db initialized');
}

// ─────────────────────────────────────────────
// 4. JOURNALIST DB
// ─────────────────────────────────────────────
function initJournalist() {
  const db = openDb('journalist');
  createMessagingTables(db);

  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id              TEXT    PRIMARY KEY,
      task_id         TEXT    NOT NULL,
      entity_id       TEXT    NOT NULL,
      doc_type        TEXT    NOT NULL CHECK(doc_type IN ('feature-article','spotlight','thought-leadership','podcast-script','youtube-script')),
      title           TEXT,
      content         TEXT,
      word_count      INTEGER DEFAULT 0,
      status          TEXT    NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','revision','approved','rejected','published')),
      version         INTEGER DEFAULT 1,
      revision_notes  TEXT,
      confidence_score INTEGER DEFAULT 0,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_articles_task_id  ON articles(task_id);
    CREATE INDEX IF NOT EXISTS idx_articles_status   ON articles(status);
    CREATE INDEX IF NOT EXISTS idx_articles_doc_type ON articles(doc_type);

    CREATE TABLE IF NOT EXISTS article_versions (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id  TEXT    NOT NULL REFERENCES articles(id),
      version     INTEGER NOT NULL,
      content     TEXT    NOT NULL,
      change_notes TEXT,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.close();
  console.log('✓ journalist.db initialized');
}

// ─────────────────────────────────────────────
// 5. MEDIA PRODUCER DB
// ─────────────────────────────────────────────
function initMediaProducer() {
  const db = openDb('media-producer');
  createMessagingTables(db);

  db.exec(`
    CREATE TABLE IF NOT EXISTS media_packages (
      id              TEXT    PRIMARY KEY,
      task_id         TEXT    NOT NULL,
      entity_id       TEXT    NOT NULL,
      tier            TEXT    NOT NULL CHECK(tier IN ('starter','growth','authority')),
      status          TEXT    NOT NULL DEFAULT 'assembling',
      created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_packages_task_id ON media_packages(task_id);

    CREATE TABLE IF NOT EXISTS social_content (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      package_id      TEXT    NOT NULL REFERENCES media_packages(id),
      platform        TEXT    NOT NULL CHECK(platform IN ('linkedin','twitter','youtube','podcast','newsletter')),
      content_type    TEXT    NOT NULL,
      content         TEXT    NOT NULL,
      status          TEXT    NOT NULL DEFAULT 'draft',
      approved_at     TEXT,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS media_assets (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      package_id      TEXT    NOT NULL REFERENCES media_packages(id),
      asset_type      TEXT    NOT NULL,
      file_path       TEXT,
      url             TEXT,
      description     TEXT,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.close();
  console.log('✓ media-producer.db initialized');
}

// ─────────────────────────────────────────────
// 6. VALIDATOR DB
// ─────────────────────────────────────────────
function initValidator() {
  const db = openDb('validator');
  createMessagingTables(db);

  db.exec(`
    CREATE TABLE IF NOT EXISTS validation_reports (
      id              TEXT    PRIMARY KEY,
      task_id         TEXT    NOT NULL,
      entity_id       TEXT    NOT NULL,
      content_id      TEXT    NOT NULL,
      overall_score   INTEGER DEFAULT 0,
      editorial_score INTEGER DEFAULT 0,
      accuracy_score  INTEGER DEFAULT 0,
      compliance_score INTEGER DEFAULT 0,
      verdict         TEXT    NOT NULL DEFAULT 'pending' CHECK(verdict IN ('pending','approved','revision','rejected')),
      issues          TEXT    DEFAULT '[]',
      recommendations TEXT    DEFAULT '[]',
      created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_validation_task_id ON validation_reports(task_id);

    CREATE TABLE IF NOT EXISTS validation_rules_log (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id       TEXT    NOT NULL REFERENCES validation_reports(id),
      rule_name       TEXT    NOT NULL,
      rule_category   TEXT    NOT NULL,
      passed          INTEGER NOT NULL DEFAULT 0,
      detail          TEXT,
      checked_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.close();
  console.log('✓ validator.db initialized');
}

// ─────────────────────────────────────────────
// 7. DISTRIBUTOR DB
// ─────────────────────────────────────────────
function initDistributor() {
  const db = openDb('distributor');
  createMessagingTables(db);

  db.exec(`
    CREATE TABLE IF NOT EXISTS distribution_jobs (
      id              TEXT    PRIMARY KEY,
      task_id         TEXT    NOT NULL,
      entity_id       TEXT    NOT NULL,
      package_id      TEXT,
      tier            TEXT    NOT NULL,
      status          TEXT    NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','in_progress','completed','failed','partial')),
      scheduled_at    TEXT,
      started_at      TEXT,
      completed_at    TEXT,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_jobs_task_id ON distribution_jobs(task_id);
    CREATE INDEX IF NOT EXISTS idx_jobs_status  ON distribution_jobs(status);

    CREATE TABLE IF NOT EXISTS distribution_log (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id          TEXT    NOT NULL REFERENCES distribution_jobs(id),
      platform        TEXT    NOT NULL,
      content_type    TEXT    NOT NULL,
      status          TEXT    NOT NULL DEFAULT 'pending',
      post_url        TEXT,
      post_id         TEXT,
      scheduled_at    TEXT,
      posted_at       TEXT,
      error_message   TEXT,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS performance_metrics (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      log_id          INTEGER REFERENCES distribution_log(id),
      platform        TEXT    NOT NULL,
      metric_name     TEXT    NOT NULL,
      metric_value    REAL    DEFAULT 0,
      recorded_at     TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.close();
  console.log('✓ distributor.db initialized');
}

// ─────────────────────────────────────────────
// 8. LEAD ORCHESTRATOR DB
// ─────────────────────────────────────────────
function initLead() {
  const db = openDb('lead');
  createMessagingTables(db);

  db.exec(`
    CREATE TABLE IF NOT EXISTS pipeline_tasks (
      id              TEXT    PRIMARY KEY,
      entity_id       TEXT    NOT NULL,
      founder_name    TEXT    NOT NULL,
      company_name    TEXT    NOT NULL,
      industry        TEXT    NOT NULL,
      current_stage   TEXT    NOT NULL DEFAULT 'intake',
      status          TEXT    NOT NULL DEFAULT 'active' CHECK(status IN ('active','paused','completed','failed','cancelled')),
      priority        INTEGER DEFAULT 5,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
      completed_at    TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_status ON pipeline_tasks(status);

    CREATE TABLE IF NOT EXISTS gate_decisions (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id         TEXT    NOT NULL REFERENCES pipeline_tasks(id),
      gate_number     INTEGER NOT NULL CHECK(gate_number BETWEEN 1 AND 4),
      decision        TEXT    NOT NULL CHECK(decision IN ('approved','rejected','revision')),
      decided_by      TEXT    NOT NULL DEFAULT 'human',
      notes           TEXT,
      decided_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS agent_activity_log (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id         TEXT    NOT NULL,
      agent_name      TEXT    NOT NULL,
      action          TEXT    NOT NULL,
      status          TEXT    NOT NULL DEFAULT 'success',
      detail          TEXT,
      tokens_used     INTEGER DEFAULT 0,
      duration_ms     INTEGER DEFAULT 0,
      logged_at       TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_activity_task_id  ON agent_activity_log(task_id);
    CREATE INDEX IF NOT EXISTS idx_activity_agent    ON agent_activity_log(agent_name);

    CREATE TABLE IF NOT EXISTS deal_queue (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id         TEXT    NOT NULL REFERENCES pipeline_tasks(id),
      entity_id       TEXT    NOT NULL,
      founder_name    TEXT    NOT NULL,
      company_name    TEXT    NOT NULL,
      industry        TEXT    NOT NULL,
      confidence_score INTEGER DEFAULT 0,
      recommended_tier TEXT,
      outreach_status TEXT    NOT NULL DEFAULT 'pending' CHECK(outreach_status IN ('pending','contacted','negotiating','closed','passed')),
      deal_value      REAL,
      notes           TEXT,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_deal_queue_status ON deal_queue(outreach_status);
  `);

  db.close();
  console.log('✓ lead.db initialized');
}

// ─────────────────────────────────────────────
// 9. ADMIN DB (Dashboard Auth + CMS)
// ─────────────────────────────────────────────
async function initAdmin() {
  const db = openDb('admin');

  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      username    TEXT    NOT NULL UNIQUE,
      password    TEXT    NOT NULL,
      role        TEXT    NOT NULL DEFAULT 'editor' CHECK(role IN ('admin','editor')),
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      last_login  TEXT
    );

    CREATE TABLE IF NOT EXISTS admin_sessions (
      id          TEXT    PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES admin_users(id),
      username    TEXT    NOT NULL,
      expires_at  TEXT    NOT NULL,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON admin_sessions(expires_at);

    CREATE TABLE IF NOT EXISTS cms_posts (
      id              TEXT    PRIMARY KEY,
      task_id         TEXT,
      entity_id       TEXT,
      doc_type        TEXT    NOT NULL,
      title           TEXT,
      content         TEXT    NOT NULL,
      status          TEXT    NOT NULL DEFAULT 'draft',
      published_at    TEXT,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_cms_posts_status   ON cms_posts(status);
    CREATE INDEX IF NOT EXISTS idx_cms_posts_doc_type ON cms_posts(doc_type);
  `);

  // Seed default admin user (password: signal-admin-2024)
  const existing = db.prepare('SELECT id FROM admin_users WHERE username = ?').get('admin');

  if (!existing) {
    const defaultPassword = process.env.ADMIN_PASSWORD || 'signal-admin-2024';
    const hash = await bcrypt.hash(defaultPassword, 12);

    db.prepare(`
      INSERT INTO admin_users (username, password, role)
      VALUES (?, ?, 'admin')
    `).run('admin', hash);

    console.log(`✓ admin.db initialized — default user: admin / ${defaultPassword}`);
    console.log('  ⚠️  Change the admin password immediately in production!');
  } else {
    console.log('✓ admin.db initialized (admin user already exists)');
  }

  db.close();
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
async function main() {
  console.log('\n🔧 SIGNAL — Database Initialization\n');

  ensureDataDir();

  initSignalScout();
  initInterview();
  initBackgrounder();
  initJournalist();
  initMediaProducer();
  initValidator();
  initDistributor();
  initLead();
  await initAdmin();

  console.log('\n✅ All databases initialized successfully.');
  console.log(`   Database files: ${DATA_DIR}/\n`);
}

main().catch(err => {
  console.error('❌ Database initialization failed:', err);
  process.exit(1);
});
