// src/app/api/auth/login-otp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { createAndSendOTP } from '@/lib/otpService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find user WITH password (normally excluded)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Password correct - send OTP
    const result = await createAndSendOTP(
      user._id.toString(),
      user.email,
      'login'
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 429 }
      );
    }

    console.log(`[Auth] Login OTP sent to: ${email}`);

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email',
      requiresOTP: true,
      userId: user._id.toString(),
      expiresAt: result.expiresAt,
    });

  } catch (error: any) {
    console.error('[Auth] Login OTP error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}