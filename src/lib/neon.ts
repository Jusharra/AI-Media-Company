import { neon } from '@neondatabase/serverless';

let _db: ReturnType<typeof neon> | null = null;

export function getNeonDb() {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL environment variable is required');
    _db = neon(url);
  }
  return _db;
}
