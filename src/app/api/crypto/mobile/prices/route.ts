import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getCryptoPrices, NETWORK_OPTIONS } from '@/lib/cryptoPrices';

const AUTH_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || '308d98ab1034136b95e1f7b43f6afde185e5892d09bbe9d1e2b68e1db9c1acae';

async function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.split(' ')[1];
    return jwt.verify(token, AUTH_SECRET) as { userId: string; email: string };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const prices = await getCryptoPrices();

    return NextResponse.json({
      success: true,
      prices,
      networks: NETWORK_OPTIONS,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[Crypto Prices] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch prices' }, { status: 500 });
  }
}

