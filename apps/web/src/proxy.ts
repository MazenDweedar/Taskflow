import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('access_token');
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/projects');

  // Only redirect to login if there's no cookie at all.
  // Don't redirect auth→projects based on cookie existence alone,
  // because the token may be expired/invalid (causes infinite loop).
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/projects/:path*'],
};
