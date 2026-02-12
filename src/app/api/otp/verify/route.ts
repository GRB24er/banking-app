// src/app/api/otp/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyOTP } from '@/lib/otpService';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { code, action } = body;

    if (!code || !action) {
      return NextResponse.json(
        { success: false, error: 'Code and action are required' },
        { status: 400 }
      );
    }

    const typeMap: Record<string, string> = {
      'transfer': 'transfer',
      'large_transfer': 'transfer',
      'profile_update': 'profile_update',
      'password_reset': 'password_reset',
      'transaction': 'transaction',
    };

    const otpType = typeMap[action] || 'transaction';

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const result = await verifyOTP(
      user._id.toString(),
      code,
      otpType as any
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification successful',
      verified: true,
    });

  } catch (error: any) {
    console.error('[OTP] Verify error:', error);
    return NextResponse.json(
      { success: false, error: 'Verification failed' },
      { status: 500 }
    );
  }
}