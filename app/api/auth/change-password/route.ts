import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getLeadDb } from '@signal/lib/db';

export async function POST(request: Request) {
  try {
    const sessionToken = request.headers.get('cookie')?.match(/signal_session=([^;]+)/)?.[1];
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const db = getLeadDb();
    const session = db.prepare(
      'SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime("now")'
    ).get(sessionToken) as { user_id: string } | undefined;

    if (!session) {
      return NextResponse.json({ error: 'Session expired or invalid' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json() as {
      currentPassword: string;
      newPassword: string;
    };

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'currentPassword and newPassword are required' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
    }

    const user = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(session.user_id) as {
      id: string; password_hash: string;
    } | undefined;

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    db.prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?').run(newHash, user.id);

    // Invalidate all other sessions for this user
    db.prepare('DELETE FROM sessions WHERE user_id = ? AND token != ?').run(user.id, sessionToken);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Change password error:', err);
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
  }
}
