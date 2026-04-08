import { NextResponse } from 'next/server';

// GET /api/auth/linkedin — redirects to LinkedIn OAuth authorization page
export async function GET() {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'LINKEDIN_CLIENT_ID not set in .env.local' }, { status: 500 });
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/linkedin/callback`;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'openid profile email w_member_social',
  });

  return NextResponse.redirect(`https://www.linkedin.com/oauth/v2/authorization?${params}`);
}
