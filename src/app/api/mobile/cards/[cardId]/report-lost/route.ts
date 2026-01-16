// src/app/api/mobile/cards/[cardId]/report-lost/route.ts
// FIXED FOR NEXT.JS 15 APP ROUTER

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

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

// POST /api/mobile/cards/[cardId]/report-lost - Report card as lost/stolen
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params;
  console.log('[Mobile Cards Report Lost] POST request for card:', cardId);
  
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

    // Determine card type from cardId
    const cardType = cardId.includes('debit') ? 'debit' : cardId.includes('virtual') ? 'virtual' : 'debit';
    
    // Initialize cardStatus if it doesn't exist
    if (!user.cardStatus) {
      user.cardStatus = { debit: 'active', virtual: 'active', credit: 'active' };
    }

    // Block the card
    user.cardStatus[cardType] = 'blocked';
    
    // Store report info
    if (!user.cardReports) {
      user.cardReports = [];
    }
    
    user.cardReports.push({
      cardId,
      cardType,
      reportedAt: new Date(),
      reason: 'lost_stolen',
      status: 'pending_replacement',
    });

    await user.save();

    console.log('[Mobile Cards Report Lost] Card', cardType, 'blocked and reported');

    return NextResponse.json({
      success: true,
      message: 'Card has been blocked. A replacement card will be mailed within 5-7 business days.',
      cardId,
      status: 'blocked',
      replacementExpected: '5-7 business days',
    });

  } catch (error: any) {
    console.error('[Mobile Cards Report Lost] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to report card' },
      { status: 500 }
    );
  }
}