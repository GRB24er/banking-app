import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { OWNER_EMAIL } from '@/lib/constants';

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  
  // Protect all admin routes
  if (path.startsWith('/admin')) {
    const session = await getToken({ req });
    const userEmail = session?.email || '';
    
    // Case-insensitive comparison
    const normalizedOwner = OWNER_EMAIL.toLowerCase().trim();
    const normalizedUser = userEmail.toLowerCase().trim();
    
    if (!session || !userEmail) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }
    
    if (normalizedUser !== normalizedOwner) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }
  
  return NextResponse.next();
}