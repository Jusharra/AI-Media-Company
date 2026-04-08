import { NextResponse } from 'next/server';
import axios from 'axios';
import { getLeadDb } from '@signal/lib/db';

// GET /api/auth/linkedin/callback — LinkedIn redirects here after user approves
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDesc = searchParams.get('error_description');

  if (error) {
    return NextResponse.redirect(
      `/dashboard?platform_error=linkedin&reason=${encodeURIComponent(errorDesc || error)}`
    );
  }

  if (!code) {
    return NextResponse.redirect('/dashboard?platform_error=linkedin&reason=no_code');
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const redirectUri = `${baseUrl}/api/auth/linkedin/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect('/dashboard?platform_error=linkedin&reason=missing_credentials');
  }

  try {
    // Exchange code for access token
    const tokenRes = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token, expires_in } = tokenRes.data as {
      access_token: string;
      expires_in: number;
    };

    // Fetch the user's profile to confirm it works
    const profileRes = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const profile = profileRes.data as { name?: string; sub?: string };

    // Store token in lead DB for runtime use (avoids editing .env.local manually)
    const db = getLeadDb();
    db.exec(`
      CREATE TABLE IF NOT EXISTS platform_tokens (
        platform TEXT PRIMARY KEY,
        access_token TEXT NOT NULL,
        expires_at TEXT,
        profile_name TEXT,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();
    db.prepare(`
      INSERT INTO platform_tokens (platform, access_token, expires_at, profile_name, updated_at)
      VALUES ('linkedin', ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(platform) DO UPDATE SET
        access_token = excluded.access_token,
        expires_at = excluded.expires_at,
        profile_name = excluded.profile_name,
        updated_at = CURRENT_TIMESTAMP
    `).run(access_token, expiresAt, profile.name || profile.sub || 'Connected');

    const name = encodeURIComponent(profile.name || 'your account');
    return NextResponse.redirect(`${baseUrl}/dashboard?platform_connected=linkedin&name=${name}`);
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { error_description?: string } }; message?: string })
      ?.response?.data?.error_description || (err as { message?: string })?.message || 'OAuth failed';
    console.error('[LinkedIn OAuth] Token exchange failed:', msg);
    return NextResponse.redirect(
      `${baseUrl}/dashboard?platform_error=linkedin&reason=${encodeURIComponent(msg)}`
    );
  }
}
