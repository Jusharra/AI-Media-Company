import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getNeonDb } from '@signal/lib/neon';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('signal_session')?.value;

    if (sessionId) {
      const db = getNeonDb();
      await db`DELETE FROM sessions WHERE id = ${sessionId}`;
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete('signal_session');
    return response;
  } catch (err) {
    console.error('Logout error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
