import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getLeadDb } from '@signal/lib/db';

export async function POST() {
  try {
    const cookieStore = cookies();
    const sessionId = cookieStore.get('signal_session')?.value;

    if (sessionId) {
      const db = getLeadDb();
      db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete('signal_session');
    return response;
  } catch (err) {
    console.error('Logout error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
