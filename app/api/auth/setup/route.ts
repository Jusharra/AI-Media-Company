import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getNeonDb } from '@signal/lib/neon';

// GET — returns whether first-run setup is still needed
export async function GET() {
  try {
    const db = getNeonDb();
    const rows = await db`SELECT COUNT(*) as count FROM admin_users` as unknown as [{ count: string }];
    return NextResponse.json({ needsSetup: parseInt(rows[0].count, 10) === 0 });
  } catch {
    return NextResponse.json({ needsSetup: false });
  }
}

// POST — create the first admin account (only works when no users exist)
export async function POST(request: Request) {
  try {
    const db = getNeonDb();

    // Guard: only allowed when no accounts exist
    const rows = await db`SELECT COUNT(*) as count FROM admin_users` as unknown as [{ count: string }];
    if (parseInt(rows[0].count, 10) > 0) {
      return NextResponse.json({ error: 'Setup already complete' }, { status: 403 });
    }

    const { username, password } = await request.json();

    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 });
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password.trim(), 12);
    const userId = uuidv4();
    const trimmedUsername = username.trim().toLowerCase();

    await db`
      INSERT INTO admin_users (id, username, password_hash, role)
      VALUES (${userId}, ${trimmedUsername}, ${passwordHash}, 'owner')
    `;

    // Log them in immediately
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await db`
      INSERT INTO sessions (id, user_id, token, expires_at)
      VALUES (${sessionId}, ${userId}, ${sessionId}, ${expiresAt})
    `;

    const response = NextResponse.json({ success: true });
    response.cookies.set('signal_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Setup error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
