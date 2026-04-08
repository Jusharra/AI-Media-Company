import { NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';

// GET /api/auth/twitter — begins Twitter OAuth 2.0 PKCE flow
// Twitter requires "Read and Write" permissions on the app before this will work.
export async function GET() {
  const clientId = process.env.TWITTER_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: 'TWITTER_CLIENT_ID not set in .env.local. Add your Twitter app\'s OAuth 2.0 Client ID.' },
      { status: 500 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const callbackUrl = `${baseUrl}/api/auth/twitter/callback`;

  const client = new TwitterApi({ clientId, clientSecret: process.env.TWITTER_CLIENT_SECRET || '' });

  const { url, codeVerifier, state } = client.generateOAuth2AuthLink(callbackUrl, {
    scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
  });

  // Store verifier + state in a short-lived cookie so the callback can verify it
  const response = NextResponse.redirect(url);
  response.cookies.set('tw_verifier', codeVerifier, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 300, // 5 minutes
    path: '/',
  });
  response.cookies.set('tw_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 300,
    path: '/',
  });

  return response;
}
