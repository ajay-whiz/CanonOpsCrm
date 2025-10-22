import { NextRequest, NextResponse } from 'next/server';

function parseJwt(token: string): any | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    // atob is available in Edge runtime
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const PUBLIC_PATHS = [
  '/login',
  '/(auth)/login',
  '/api/auth/set-session',
  '/api/webhooks/asana',
  '/_next',
  '/favicon.ico',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Only protect main app pages
  const protectedPrefixes = ['/dashboard', '/payment-requests', '/contacts', '/containers'];
  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const accessToken = req.cookies.get('access_token')?.value;
  if (!accessToken) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  const payload = parseJwt(accessToken) || {};
  const role = payload?.app_metadata?.role as string | undefined;
  const allowed = ['admin', 'finance', 'support'];

  if (!role || !allowed.includes(role)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/payment-requests/:path*', '/contacts/:path*', '/containers/:path*'],
};
