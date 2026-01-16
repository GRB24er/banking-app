// src/app/api/mobile/limits/route.ts
// ADD THIS FILE TO YOUR WEB PROJECT: app/api/mobile/limits/route.ts

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

const AUTH_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || '308d98ab1034136b95e1f7b43f6afde185e5892d09bbe9d1e2b68e1db9c1acae';

async function verifyMobileToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, AUTH_SECRET) as { userId: string; email: string };
    return decoded;
  } catch {
    return null;
  }
}

// GET /api/mobile/limits - Get user's spending limits
export async function GET(request: NextRequest) {
  console.log('[Mobile Limits] GET request');
  
  try {
    const decoded = await verifyMobileToken(request);
    
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get today's start time
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Calculate today's spending from transactions
    const todayTransactions = await Transaction.find({
      userId: user._id,
      createdAt: { $gte: todayStart },
      type: { $in: ['transfer-out', 'withdrawal', 'payment', 'purchase'] },
      status: { $in: ['completed', 'approved', 'pending'] },
    }).lean();

    // Sum up today's spending
    let dailySpent = 0;
    let atmSpent = 0;
    let onlineSpent = 0;

    (todayTransactions as any[]).forEach((tx) => {
      const amount = Math.abs(tx.amount);
      dailySpent += amount;
      
      if (tx.type === 'withdrawal' || tx.origin === 'atm') {
        atmSpent += amount;
      }
      
      if (tx.channel === 'online' || tx.origin === 'online_purchase') {
        onlineSpent += amount;
      }
    });

    // Get user's limits (with defaults)
    const userLimits = user.limits || {};

    const limits = {
      dailySpending: {
        used: Math.round(dailySpent * 100) / 100,
        limit: userLimits.dailySpending || 5000,
        remaining: Math.max(0, (userLimits.dailySpending || 5000) - dailySpent),
      },
      atmWithdrawal: {
        used: Math.round(atmSpent * 100) / 100,
        limit: userLimits.atmWithdrawal || 1000,
        remaining: Math.max(0, (userLimits.atmWithdrawal || 1000) - atmSpent),
      },
      onlinePurchase: {
        used: Math.round(onlineSpent * 100) / 100,
        limit: userLimits.onlinePurchase || 3000,
        remaining: Math.max(0, (userLimits.onlinePurchase || 3000) - onlineSpent),
      },
      transferLimit: {
        used: 0, // Would calculate from transfer transactions
        limit: userLimits.transferLimit || 10000,
        remaining: userLimits.transferLimit || 10000,
      },
      internationalTransfer: {
        used: 0,
        limit: userLimits.internationalTransfer || 5000,
        remaining: userLimits.internationalTransfer || 5000,
      },
    };

    console.log('[Mobile Limits] Returning limits for user:', user.email);

    return NextResponse.json({
      success: true,
      limits,
      resetTime: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    });

  } catch (error: any) {
    console.error('[Mobile Limits] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch limits' },
      { status: 500 }
    );
  }
}

// PUT /api/mobile/limits - Request limit change (for admin approval)
export async function PUT(request: NextRequest) {
  try {
    const decoded = await verifyMobileToken(request);
    
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { limitType, requestedAmount, reason } = body;

    // Store limit change request (for admin approval)
    if (!user.limitChangeRequests) {
      user.limitChangeRequests = [];
    }

    user.limitChangeRequests.push({
      limitType,
      currentLimit: user.limits?.[limitType] || 0,
      requestedLimit: requestedAmount,
      reason,
      status: 'pending',
      requestedAt: new Date(),
    });

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Limit change request submitted for review. You will be notified once approved.',
      requestId: `LCR-${Date.now()}`,
    });

  } catch (error: any) {
    console.error('[Mobile Limits] PUT Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit limit request' },
      { status: 500 }
    );
  }
}