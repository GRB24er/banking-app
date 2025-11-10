import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Hardcoded admin emails
const ADMIN_EMAILS = [
  'admin@horizonbank.com',
  'your-email@example.com',
];

// Hardcoded NextAuth secret
const NEXTAUTH_SECRET = '91a6934f55c5148c0c5cc48642a60acdce3560a5613bd3ef0c7ebc5eda61419ebe25f2b1ba7434f084b5fff46c824ee8062e3977782c9c0f40f0b0e37fca5948';

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  console.log('🔍 Middleware processing path:', path);

  try {
    // Get session token with hardcoded secret
    const session = await getToken({ 
      req, 
      secret: NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production',
    });

    console.log('📋 Session data:', {
      exists: !!session,
      email: session?.email || 'No email',
      role: session?.role || 'No role',
      name: session?.name || 'No name'
    });

    // Protect admin routes
    if (path.startsWith('/admin')) {
      console.log('🔐 Checking admin access...');
      
      if (!session || !session.email) {
        console.log('❌ No session or email found, redirecting to signin');
        return NextResponse.redirect(new URL('/auth/signin?error=no-session', req.url));
      }

      const userEmail = (session.email as string).toLowerCase().trim();
      const isAdminEmail = ADMIN_EMAILS.some(adminEmail =>
        adminEmail.toLowerCase().trim() === userEmail
      );
      const isAdminRole = session.role === 'admin' || session.role === 'superadmin';

      console.log('🔍 Admin check results:', {
        userEmail,
        isAdminEmail,
        isAdminRole,
        sessionRole: session.role
      });

      if (!isAdminEmail && !isAdminRole) {
        console.log('❌ Access denied - not admin');
        return NextResponse.redirect(new URL('/dashboard?error=access-denied', req.url));
      }

      console.log('✅ Admin access granted');
    }

    // Protect other authenticated routes
    const protectedPaths = [
      '/dashboard',
      '/transfers',
      '/accounts',
      '/cards',
      '/profile',
      '/settings',
      '/transactions',
    ];

    if (protectedPaths.some(p => path.startsWith(p))) {
      if (!session) {
        console.log('❌ No session for protected path, redirecting to signin');
        return NextResponse.redirect(new URL('/auth/signin?error=auth-required', req.url));
      }
      console.log('✅ Protected route access granted');
    }

    console.log('✅ Middleware completed successfully');
    return NextResponse.next();

  } catch (error) {
    console.error('❌ Middleware error:', error);
    return NextResponse.redirect(new URL('/auth/signin?error=middleware-error', req.url));
  }
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/transfers/:path*',
    '/accounts/:path*',
    '/cards/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/transactions/:path*',
  ],
};