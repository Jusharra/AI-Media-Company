import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const sessionId = request.cookies.get('signal_session')?.value;
  const { pathname } = request.nextUrl;

  // Protect /dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!sessionId) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect authenticated users away from login
  if (pathname === '/login' && sessionId) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/dashboard/:path*'],
};
