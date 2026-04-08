import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getNeonDb } from '@signal/lib/neon';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('signal_session')?.value;

    if (!sessionId) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const db = getNeonDb();
    const rows = await db`
      SELECT s.*, u.username FROM sessions s
      JOIN admin_users u ON u.id = s.user_id
      WHERE s.id = ${sessionId} AND s.expires_at > NOW()
    ` as unknown as Array<{ username: string }>;

    if (!rows[0]) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true, username: rows[0].username });
  } catch (err) {
    console.error('Session check error:', err);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
