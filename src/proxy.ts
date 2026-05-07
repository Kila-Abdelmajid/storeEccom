import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';

export async function proxy(request: NextRequest) {
  const session = await getSession();
  const { pathname } = request.nextUrl;

  
  // Define protected admin routes
  const adminRoutes = ['/Dashboard', '/api/users', '/api/categories', '/api/product'];
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
  
  // Also protect any route that starts with /Dashboard (all dashboard pages)
  const isDashboardPage = pathname.startsWith('/Dashboard');

  if ((isAdminRoute || isDashboardPage) && !session) {
    // Not logged in – redirect to login
    const url = new URL('/login', request.url);
    return NextResponse.redirect(url);
  }

  if ((isAdminRoute || isDashboardPage) && session?.role !== 'admin') {
      console.log('Redirecting to login: no session');

    // Logged in but not admin – redirect to homepage
    const url = new URL('/', request.url);
    return NextResponse.redirect(url);
  }

  // Also optionally protect user API endpoints that require logged-in user
  // (e.g., /api/orders, /api/profile) – check session exists but any role

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/Dashboard/:path*',
    '/api/users/:path*',
    '/api/categories/:path*',
    '/api/product/:path*',
    // add other admin APIs
  ],
};