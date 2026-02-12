// src/app/api/otp/request/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { createAndSendOTP } from '@/lib/otpService';

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
    const { action, metadata } = body;

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

    const result = await createAndSendOTP(
      user._id.toString(),
      user.email,
      otpType as any,
      metadata
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 429 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email',
      expiresIn: 600,
    });

  } catch (error: any) {
    console.error('[OTP] Request error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send verification code' },
      { status: 500 }
    );
  }
}