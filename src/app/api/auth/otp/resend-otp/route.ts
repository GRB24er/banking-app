// src/app/api/auth/resend-otp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { createAndSendOTP } from '@/lib/otpService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type = 'login' } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Send new OTP
    const result = await createAndSendOTP(
      userId,
      user.email,
      type as any
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 429 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'New verification code sent',
      expiresAt: result.expiresAt,
    });

  } catch (error: any) {
    console.error('[Auth] Resend OTP error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to resend code' },
      { status: 500 }
    );
  }
}