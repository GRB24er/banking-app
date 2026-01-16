// src/app/api/auth/mobile/route.ts
// ADD THIS FILE TO: app/api/auth/mobile/route.ts

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

const AUTH_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || '308d98ab1034136b95e1f7b43f6afde185e5892d09bbe9d1e2b68e1db9c1acae';

// POST /api/auth/mobile - Mobile login
export async function POST(request: NextRequest) {
  console.log('[Mobile Auth] POST - Login attempt');

  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      console.log('[Mobile Auth] Missing email or password');
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find user with password field
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      console.log('[Mobile Auth] User not found:', normalizedEmail);
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Compare password
    const isMatch = await bcrypt.compare(password.trim(), user.password);

    if (!isMatch) {
      console.log('[Mobile Auth] Password mismatch for:', normalizedEmail);
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    console.log('[Mobile Auth] Login successful for:', user.email);

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        role: user.role || 'user',
      },
      AUTH_SECRET,
      { expiresIn: '30d' }
    );

    // Parse name into first/last
    const nameParts = (user.name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        _id: user._id.toString(),
        name: user.name,
        firstName,
        lastName,
        email: user.email,
        role: user.role || 'user',
        verified: user.verified || false,
        accountNumber: user.accountNumber,
        routingNumber: user.routingNumber,
        checkingBalance: user.checkingBalance || 0,
        savingsBalance: user.savingsBalance || 0,
        investmentBalance: user.investmentBalance || 0,
        balance: (user.checkingBalance || 0) + (user.savingsBalance || 0) + (user.investmentBalance || 0),
      },
    });

  } catch (error: any) {
    console.error('[Mobile Auth] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

// GET /api/auth/mobile - Verify token and get user data
export async function GET(request: NextRequest) {
  console.log('[Mobile Auth] GET - Token verification');

  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, AUTH_SECRET);
    } catch (jwtError) {
      console.log('[Mobile Auth] Token verification failed');
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Get fresh user data
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Parse name
    const nameParts = (user.name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    console.log('[Mobile Auth] Token valid for:', user.email);

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        _id: user._id.toString(),
        name: user.name,
        firstName,
        lastName,
        email: user.email,
        role: user.role || 'user',
        verified: user.verified || false,
        accountNumber: user.accountNumber,
        routingNumber: user.routingNumber,
        checkingBalance: user.checkingBalance || 0,
        savingsBalance: user.savingsBalance || 0,
        investmentBalance: user.investmentBalance || 0,
        balance: (user.checkingBalance || 0) + (user.savingsBalance || 0) + (user.investmentBalance || 0),
      },
    });

  } catch (error: any) {
    console.error('[Mobile Auth] GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Token verification failed' },
      { status: 500 }
    );
  }
}