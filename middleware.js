import { NextResponse } from 'next/server';
import { parse } from 'cookie';

// This middleware will run on every request
export function middleware(request) {
  // Get the pathname from the URL
  const { pathname } = request.nextUrl;
  
  // Only apply to admin routes (except login)
  if (pathname.startsWith('/admin') && !pathname.includes('/admin/login')) {
    // Get cookies from the request
    const cookies = parse(request.headers.get('cookie') || '');
    const authToken = cookies.auth_token;
    
    // If no auth token is present, redirect to login
    if (!authToken) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }
  }
  
  // Continue with the request for non-admin routes or if authenticated
  return NextResponse.next();
}

// Configure the middleware to run only on specific paths
export const config = {
  matcher: ['/admin/:path*'],
};
