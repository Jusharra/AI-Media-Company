import { NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';
import { getNeonDb } from '@signal/lib/neon';

// GET /api/auth/twitter/callback — Twitter redirects here after user approves
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  if (error) {
    return NextResponse.redirect(
      `${baseUrl}/dashboard?platform_error=twitter&reason=${encodeURIComponent(error)}`
    );
  }

  // Read verifier + state from cookies
  const cookieHeader = request.headers.get('cookie') || '';
  const getCookie = (name: string) => {
    const match = cookieHeader.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  };

  const codeVerifier = getCookie('tw_verifier');
  const savedState = getCookie('tw_state');

  if (!code || !codeVerifier || !savedState || state !== savedState) {
    return NextResponse.redirect(
      `${baseUrl}/dashboard?platform_error=twitter&reason=invalid_state`
    );
  }

  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET || '';
  const callbackUrl = `${baseUrl}/api/auth/twitter/callback`;

  if (!clientId) {
    return NextResponse.redirect(
      `${baseUrl}/dashboard?platform_error=twitter&reason=missing_client_id`
    );
  }

  try {
    const client = new TwitterApi({ clientId, clientSecret });
    const { accessToken, refreshToken, expiresIn } = await client.loginWithOAuth2({
      code,
      codeVerifier,
      redirectUri: callbackUrl,
    });

    // Fetch user profile to confirm
    const authedClient = new TwitterApi(accessToken);
    const me = await authedClient.v2.me();
    const username = me.data.username || 'unknown';

    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;
    const profileName = `@${username}`;
    const refreshTokenVal = refreshToken || null;

    const db = getNeonDb();
    await db`
      INSERT INTO platform_tokens (platform, access_token, refresh_token, expires_at, profile_name, updated_at)
      VALUES ('twitter', ${accessToken}, ${refreshTokenVal}, ${expiresAt}, ${profileName}, NOW())
      ON CONFLICT (platform) DO UPDATE SET
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        expires_at = EXCLUDED.expires_at,
        profile_name = EXCLUDED.profile_name,
        updated_at = NOW()
    `;

    const response = NextResponse.redirect(
      `${baseUrl}/dashboard?platform_connected=twitter&name=${encodeURIComponent('@' + username)}`
    );
    // Clear the verifier cookies
    response.cookies.set('tw_verifier', '', { maxAge: 0, path: '/' });
    response.cookies.set('tw_state', '', { maxAge: 0, path: '/' });
    return response;
  } catch (err: unknown) {
    const msg = (err as { message?: string })?.message || 'Twitter OAuth failed';
    console.error('[Twitter OAuth] Callback failed:', msg);
    return NextResponse.redirect(
      `${baseUrl}/dashboard?platform_error=twitter&reason=${encodeURIComponent(msg)}`
    );
  }
}
