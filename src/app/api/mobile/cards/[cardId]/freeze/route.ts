// src/app/api/mobile/cards/[cardId]/freeze/route.ts
// ADD THIS FILE TO YOUR WEB PROJECT: app/api/mobile/cards/[cardId]/freeze/route.ts

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

// POST /api/mobile/cards/[cardId]/freeze - Freeze/Unfreeze card
export async function POST(
  request: NextRequest,
  { params }: { params: { cardId: string } }
) {
  console.log('[Mobile Cards Freeze] POST request for card:', params.cardId);
  
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

    const { cardId } = params;
    
    // Determine card type from cardId
    const cardType = cardId.includes('debit') ? 'debit' : cardId.includes('virtual') ? 'virtual' : 'debit';
    
    // Initialize cardStatus if it doesn't exist
    if (!user.cardStatus) {
      user.cardStatus = { debit: 'active', virtual: 'active', credit: 'active' };
    }

    // Toggle freeze status
    const currentStatus = user.cardStatus[cardType] || 'active';
    const newStatus = currentStatus === 'frozen' ? 'active' : 'frozen';
    
    user.cardStatus[cardType] = newStatus;
    await user.save();

    console.log('[Mobile Cards Freeze] Card', cardType, 'status changed to:', newStatus);

    return NextResponse.json({
      success: true,
      message: newStatus === 'frozen' ? 'Card has been frozen' : 'Card has been unfrozen',
      cardId,
      status: newStatus,
    });

  } catch (error: any) {
    console.error('[Mobile Cards Freeze] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update card status' },
      { status: 500 }
    );
  }
}