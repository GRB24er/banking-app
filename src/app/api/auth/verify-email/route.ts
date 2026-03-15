// src/app/api/auth/verify-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { sendWelcomeEmail } from '@/lib/mail';

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { message: 'Email and verification code are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    await connectDB();

    const user = await User.findOne({ email: normalizedEmail }).select(
      '+verificationCode +verificationCodeExpiry'
    );

    if (!user) {
      return NextResponse.json(
        { message: 'No account found with this email address' },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { message: 'Email is already verified', alreadyVerified: true },
        { status: 200 }
      );
    }

    if (!user.verificationCode) {
      return NextResponse.json(
        { message: 'No verification code found. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check expiry
    if (user.verificationCodeExpiry && new Date() > user.verificationCodeExpiry) {
      return NextResponse.json(
        { message: 'Verification code has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check code match
    if (user.verificationCode !== code.trim()) {
      return NextResponse.json(
        { message: 'Invalid verification code. Please try again.' },
        { status: 400 }
      );
    }

    // Mark email as verified and clear the code
    user.emailVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpiry = undefined;
    await user.save();

    console.log('Email verified successfully for:', normalizedEmail);

    // Send welcome email now that email is verified
    try {
      await sendWelcomeEmail(normalizedEmail, { name: user.name });
      console.log('Welcome email sent after verification');
    } catch (emailError) {
      console.error('Welcome email error (non-fatal):', emailError);
    }

    return NextResponse.json({
      message: 'Email verified successfully! You can now sign in.',
      success: true,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { message: 'Verification failed. Please try again later.' },
      { status: 500 }
    );
  }
}
