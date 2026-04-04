import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getLeadDb } from '@signal/lib/db';

export async function GET() {
  try {
    const cookieStore = cookies();
    const sessionId = cookieStore.get('signal_session')?.value;

    if (!sessionId) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const db = getLeadDb();
    const session = db.prepare(`
      SELECT s.*, u.username FROM sessions s
      JOIN admin_users u ON u.id = s.user_id
      WHERE s.id = ? AND s.expires_at > datetime('now')
    `).get(sessionId) as { username: string } | undefined;

    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true, username: session.username });
  } catch (err) {
    console.error('Session check error:', err);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
