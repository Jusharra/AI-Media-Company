import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getNeonDb } from '@signal/lib/neon';

type AdminUser = { id: string; username: string; password_hash: string };

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }

    const db = getNeonDb();

    // Look up user
    const users = await db`SELECT * FROM admin_users WHERE username = ${username}` as unknown as AdminUser[];
    const user = users[0];

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    await db`UPDATE admin_users SET last_login = NOW() WHERE id = ${user.id}`;

    // Create session
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await db`
      INSERT INTO sessions (id, user_id, token, expires_at)
      VALUES (${sessionId}, ${user.id}, ${sessionId}, ${expiresAt})
    `;

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
