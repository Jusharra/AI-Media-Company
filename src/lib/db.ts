import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = process.env.DB_DIR || path.join(__dirname, '..', 'agents');

// Shared SQL schema used across all agent databases
const BASE_SCHEMA = `
CREATE TABLE IF NOT EXISTS entities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT,
  industry TEXT CHECK(industry IN ('healthcare', 'oil_gas', 'construction', 'other')),
  source TEXT CHECK(source IN ('manual', 'api', 'voice', 'agent')),
  status TEXT CHECK(status IN ('pending', 'approved', 'rejected', 'featured', 'archived')),
  score INTEGER DEFAULT 0,
  monetization_flag INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  entity_id TEXT,
  parent_task_id TEXT,
  agent TEXT,
  status TEXT CHECK(status IN (
    'pending','in_progress','awaiting_validation',
    'revision','awaiting_approval','approved','complete','failed'
  )),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS outputs (
  id TEXT PRIMARY KEY,
  task_id TEXT REFERENCES tasks(id),
  entity_id TEXT,
  doc_type TEXT,
  content TEXT,
  validation_score INTEGER,
  confidence_tier TEXT CHECK(confidence_tier IN ('high','medium','low')),
  version INTEGER DEFAULT 1,
  status TEXT CHECK(status IN ('draft','revision','approved','published')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages_in (
  id TEXT PRIMARY KEY,
  from_agent TEXT,
  message_type TEXT,
  payload TEXT,
  processed INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages_out (
  id TEXT PRIMARY KEY,
  to_agent TEXT,
  message_type TEXT,
  payload TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

const LEAD_SCHEMA = `
CREATE TABLE IF NOT EXISTS gate_decisions (
  id TEXT PRIMARY KEY,
  task_id TEXT,
  gate_number INTEGER CHECK(gate_number IN (1,2,3,4)),
  decision TEXT CHECK(decision IN ('approved','rejected','revision')),
  notes TEXT,
  decided_by TEXT CHECK(decided_by IN ('human','auto')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK(role IN ('owner','editor','viewer')) DEFAULT 'editor',
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES admin_users(id),
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pipeline_state (
  task_id TEXT PRIMARY KEY,
  entity_id TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  current_stage TEXT,
  gate_status TEXT DEFAULT '{}',
  validation_scores TEXT DEFAULT '{}',
  content_ids TEXT DEFAULT '[]',
  distribution_urls TEXT DEFAULT '{}',
  monetization_flag INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

const DISTRIBUTOR_SCHEMA = `
CREATE TABLE IF NOT EXISTS distribution_logs (
  id TEXT PRIMARY KEY,
  task_id TEXT,
  content_id TEXT,
  platform TEXT CHECK(platform IN ('website','linkedin','twitter','youtube','instagram')),
  post_url TEXT,
  status TEXT CHECK(status IN ('pending','published','failed')),
  performance_metrics TEXT,
  published_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

const agentDbCache: Record<string, Database.Database> = {};

export function getDb(agentName: string): Database.Database {
  if (agentDbCache[agentName]) return agentDbCache[agentName];

  const agentDir = path.join(DB_DIR, agentName);
  fs.mkdirSync(agentDir, { recursive: true });

  const dbPath = path.join(agentDir, `${agentName.replace(/-/g, '_')}.db`);
  const db = new Database(dbPath);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(BASE_SCHEMA);

  // Additive migrations — safe to run repeatedly (errors are swallowed)
  const entityMigrations = ['email TEXT', 'notes TEXT', 'hook TEXT'];
  for (const col of entityMigrations) {
    try { db.exec(`ALTER TABLE entities ADD COLUMN ${col}`); } catch { /* column already exists */ }
  }

  if (agentName === 'lead') {
    db.exec(LEAD_SCHEMA);
  }
  if (agentName === 'distributor') {
    db.exec(DISTRIBUTOR_SCHEMA);
  }

  agentDbCache[agentName] = db;
  return db;
}

export function getAllAgentDbs() {
  const agents = [
    'signal-scout', 'interview-engine', 'backgrounder',
    'journalist', 'media-producer', 'validator', 'distributor', 'lead'
  ];
  return agents.reduce((acc, name) => {
    acc[name] = getDb(name);
    return acc;
  }, {} as Record<string, Database.Database>);
}

// Utility: get lead db (for auth + pipeline state)
export const getLeadDb = () => getDb('lead');
