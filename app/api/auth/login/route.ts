import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getLeadDb } from '@signal/lib/db';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }

    const db = getLeadDb();

    // Look up user
    const user = db.prepare('SELECT * FROM admin_users WHERE username = ? AND is_active = 1').get(username) as {
      id: string; username: string; password_hash: string;
    } | undefined;

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Create session
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h

    db.prepare(`
      INSERT INTO sessions (id, user_id, expires_at, created_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `).run(sessionId, user.id, expiresAt);

    // Set cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set('signal_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24h
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
