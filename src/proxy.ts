// middleware.ts (في جذر المشروع، خارج مجلد app)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'your-secret-key';
const key = new TextEncoder().encode(secretKey);

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('session')?.value;
  const { pathname } = request.nextUrl;

  // المسارات المحمية
  const adminRoutes = ['/Dashboard','/productsManagement','/ordersManagement','/categoriesManagement','/messagesManagement','/usersManagement','/clientReviewsManagement'];
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
  const userPages = ['/profile', '/orders', '/cart'];
  const isUserPage = userPages.some(page => pathname === page);

  // الصفحات العمومية لا تحتاج حماية
  if (!isAdminRoute && !isUserPage) {
    return NextResponse.next();
  }

  // إذا لم يكن هناك توكن، التوجيه إلى تسجيل الدخول
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // التحقق من صحة التوكن (هنا token مؤكد أنه string)
  try {
    const { payload } = await jwtVerify(token, key);
    if (isAdminRoute && payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  } catch {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname); // Ta hna f l-error d token
    return NextResponse.redirect(loginUrl);  }
}

export const config = {
  matcher: [
    '/Dashboard/:path*',
    '/productsManagement/:path*',
    '/ordersManagement/:path*',
    '/categoriesManagement/:path*',
    '/messagesManagement/:path*',
    '/usersManagement/:path*',
    '/clientReviewsManagement/:path*',
    '/profile',
    '/cart',
  ],
};