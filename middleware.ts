import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 100; // 100 requests per window

const ipMap = new Map<string, { count: number; expires: number }>();

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Protect routes server-side to prevent auth flicker
  const protectedPaths = ['/dashboard', '/settings', '/projects', '/teams', '/rotation', '/access-requests', '/admin', '/audit', '/integrations', '/notifications'];
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  
  // Auth Check
  if (isProtectedPath || pathname === '/login' || pathname === '/register') {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    if (isProtectedPath && !token) {
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', encodeURI(request.url));
      return NextResponse.redirect(url);
    }
    
    if ((pathname === '/login' || pathname === '/register') && token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Only limit API routes
  if (pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               '127.0.0.1';
    const now = Date.now();
    
    // Clean up expired entries periodically (simplistic approach)
    if (Math.random() < 0.05) { // 5% chance to cleanup
        for (const [key, val] of ipMap.entries()) {
            if (val.expires < now) ipMap.delete(key);
        }
    }

    const limit = ipMap.get(ip);

    if (limit && limit.expires > now) {
      if (limit.count >= RATE_LIMIT_MAX) {
        return new NextResponse(JSON.stringify({ error: 'Too Many Requests' }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      limit.count++;
    } else {
      ipMap.set(ip, { count: 1, expires: now + RATE_LIMIT_WINDOW });
    }
  }

  const response = NextResponse.next();
  
  // Add Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
