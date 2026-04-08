import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getNeonDb } from '@signal/lib/neon';

export async function POST(request: Request) {
  try {
    const sessionToken = request.headers.get('cookie')?.match(/signal_session=([^;]+)/)?.[1];
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const db = getNeonDb();
    const sessions = await db`
      SELECT user_id FROM sessions WHERE token = ${sessionToken} AND expires_at > NOW()
    ` as unknown as Array<{ user_id: string }>;
    const session = sessions[0];

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

    const users = await db`
      SELECT id, password_hash FROM admin_users WHERE id = ${session.user_id}
    ` as unknown as Array<{ id: string; password_hash: string }>;
    const user = users[0];

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await db`UPDATE admin_users SET password_hash = ${newHash} WHERE id = ${user.id}`;

    // Invalidate all other sessions for this user
    await db`DELETE FROM sessions WHERE user_id = ${user.id} AND token != ${sessionToken}`;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Change password error:', err);
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
  }
}
