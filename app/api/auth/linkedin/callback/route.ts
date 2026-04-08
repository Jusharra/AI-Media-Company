import { NextResponse } from 'next/server';
import axios from 'axios';
import { getNeonDb } from '@signal/lib/neon';

// GET /api/auth/linkedin/callback — LinkedIn redirects here after user approves
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDesc = searchParams.get('error_description');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  if (error) {
    return NextResponse.redirect(
      `${baseUrl}/dashboard?platform_error=linkedin&reason=${encodeURIComponent(errorDesc || error)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/dashboard?platform_error=linkedin&reason=no_code`);
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const redirectUri = `${baseUrl}/api/auth/linkedin/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${baseUrl}/dashboard?platform_error=linkedin&reason=missing_credentials`);
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

    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();
    const profileName = profile.name || profile.sub || 'Connected';

    const db = getNeonDb();
    await db`
      INSERT INTO platform_tokens (platform, access_token, expires_at, profile_name, updated_at)
      VALUES ('linkedin', ${access_token}, ${expiresAt}, ${profileName}, NOW())
      ON CONFLICT (platform) DO UPDATE SET
        access_token = EXCLUDED.access_token,
        expires_at = EXCLUDED.expires_at,
        profile_name = EXCLUDED.profile_name,
        updated_at = NOW()
    `;

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
