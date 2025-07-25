import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default withAuth(
  function middleware(req: NextRequest) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Public routes that don't require authentication
    const publicRoutes = [
      '/auth/login',
      '/auth/register',
      '/auth/forgot-password',
      '/auth/reset-password',
      '/offline',
      '/api/auth',
      '/manifest.json',
      '/sw.js',
      '/_next',
      '/favicon.ico',
    ];

    // Check if the current path is public
    const isPublicRoute = publicRoutes.some(route => 
      pathname.startsWith(route)
    );

    // Allow public routes
    if (isPublicRoute) {
      return NextResponse.next();
    }

    // Redirect to login if not authenticated
    if (!token) {
      const loginUrl = new URL('/auth/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Premium routes that require premium subscription
    const premiumRoutes = [
      '/reports',
      '/analytics',
      '/export',
      '/premium',
      '/backup',
    ];

    const isPremiumRoute = premiumRoutes.some(route => 
      pathname.startsWith(route)
    );

    // Check premium access
    if (isPremiumRoute && !token.isPremium) {
      const upgradeUrl = new URL('/upgrade', req.url);
      upgradeUrl.searchParams.set('feature', pathname.split('/')[1]);
      return NextResponse.redirect(upgradeUrl);
    }

    // API route protection
    if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
      // Ensure API requests have valid authentication
      if (!token) {
        return new NextResponse(
          JSON.stringify({ 
            error: 'Unauthorized',
            message: 'Authentication required' 
          }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Premium API endpoints
      const premiumApiRoutes = [
        '/api/reports',
        '/api/analytics',
        '/api/export',
        '/api/backup',
        '/api/sync',
      ];

      const isPremiumApiRoute = premiumApiRoutes.some(route => 
        pathname.startsWith(route)
      );

      if (isPremiumApiRoute && !token.isPremium) {
        return new NextResponse(
          JSON.stringify({ 
            error: 'Premium Required',
            message: 'This feature requires a premium subscription',
            upgrade: true
          }),
          { 
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // Add security headers
    const response = NextResponse.next();
    
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    
    // CSP Header for security
    const cspHeader = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.stripe.com",
      "frame-src https://js.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join('; ');
    
    response.headers.set('Content-Security-Policy', cspHeader);

    return response;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // This callback determines if the request is authorized
        // Return true to allow access, false to deny
        const { pathname } = req.nextUrl;

        // Always allow public routes
        const publicRoutes = [
          '/auth/login',
          '/auth/register',
          '/auth/forgot-password',
          '/auth/reset-password',
          '/offline',
          '/manifest.json',
          '/sw.js',
          '/_next',
          '/favicon.ico',
        ];

        if (publicRoutes.some(route => pathname.startsWith(route))) {
          return true;
        }

        // Require authentication for all other routes
        return !!token;
      },
    },
    pages: {
      signIn: '/auth/login',
      error: '/auth/error',
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|icons/|sw.js|manifest.json).*)',
  ],
};