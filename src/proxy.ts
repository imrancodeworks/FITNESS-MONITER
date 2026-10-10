import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secretKey = process.env.SESSION_SECRET || "default_development_secret_key_change_in_production_1234567890";
const key = new TextEncoder().encode(secretKey);

export default async function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value;
  
  const isLoginPage = request.nextUrl.pathname.startsWith('/login');

  let payload = null;
  if (sessionCookie) {
    try {
      const verified = await jwtVerify(sessionCookie, key, { algorithms: ["HS256"] });
      payload = verified.payload;
    } catch {
      // Invalid token
      payload = null;
    }
  }

  // If no valid session and trying to access a protected route
  if (!payload && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If valid session and trying to access login page
  if (payload && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
