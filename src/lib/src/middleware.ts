import { NextResponse, NextRequest } from 'next/server';

const hits = new Map<string, { n: number; t: number }>();
function limited(ip: string, max: number, winMs: number) {
  const now = Date.now(); const h = hits.get(ip) ?? { n: 0, t: now };
  if (now - h.t > winMs) { h.n = 0; h.t = now; }
  h.n++; hits.set(ip, h); return h.n > max;
}

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'local';
  if (req.nextUrl.pathname.startsWith('/api/auth') && req.method === 'POST' && limited(ip, 10, 60_000))
    return new NextResponse('RATE_LIMIT', { status: 429 });
  return res;
}
export const config = { matcher: '/api/:path*' };
