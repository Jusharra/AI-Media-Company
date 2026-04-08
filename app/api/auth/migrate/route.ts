import { NextResponse } from 'next/server';
import { getNeonDb } from '@signal/lib/neon';

// GET /api/auth/migrate?secret=YOUR_MIGRATE_SECRET
// Run once after deploying to create Neon tables.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (!process.env.MIGRATE_SECRET || secret !== process.env.MIGRATE_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const db = getNeonDb();

    await db`
      CREATE TABLE IF NOT EXISTS admin_users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'owner',
        last_login TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    await db`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    await db`
      CREATE TABLE IF NOT EXISTS platform_tokens (
        platform TEXT PRIMARY KEY,
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        expires_at TIMESTAMPTZ,
        profile_name TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    return NextResponse.json({ success: true, message: 'Neon schema created (or already existed).' });
  } catch (err) {
    console.error('Migration error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
