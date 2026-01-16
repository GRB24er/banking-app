// src/app/api/mobile/cards/route.ts
// ADD THIS FILE TO YOUR WEB PROJECT: app/api/mobile/cards/route.ts

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

// Helper to generate card number from account
function generateCardNumber(accountNumber: string, type: 'debit' | 'credit' | 'virtual'): string {
  const prefix = type === 'debit' ? '4532' : type === 'credit' ? '5425' : '4916';
  const last4 = accountNumber?.slice(-4) || '0000';
  const middle = accountNumber?.slice(0, 8)?.padEnd(8, '0') || '00000000';
  return `${prefix}${middle}${last4}`;
}

// Helper to mask card number
function maskCardNumber(cardNumber: string): string {
  if (!cardNumber || cardNumber.length < 16) return '•••• •••• •••• ••••';
  return `${cardNumber.slice(0, 4)} •••• •••• ${cardNumber.slice(-4)}`;
}

// GET /api/mobile/cards - Get user's cards
export async function GET(request: NextRequest) {
  console.log('[Mobile Cards] GET request');
  
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

    const nameParts = (user.name || '').split(' ');
    const cardHolder = `${nameParts[0] || 'CARD'} ${nameParts.slice(1).join(' ') || 'HOLDER'}`.toUpperCase();
    const accountNum = user.accountNumber || '0000000000';

    // Generate cards based on user data
    // You can also store cards in a separate collection if needed
    const cards = [
      {
        _id: `card_debit_${user._id}`,
        type: 'debit',
        cardNumber: generateCardNumber(accountNum, 'debit'),
        maskedNumber: maskCardNumber(generateCardNumber(accountNum, 'debit')),
        cardHolder: cardHolder,
        expiryDate: '12/28',
        cvv: '***',
        balance: user.checkingBalance || 0,
        status: user.cardStatus?.debit || 'active',
        lastFour: accountNum.slice(-4) || '0000',
        network: 'visa',
        accountType: 'checking',
      },
    ];

    // Add virtual card if user has savings
    if ((user.savingsBalance || 0) > 0) {
      const virtualLast4 = String(Math.abs(user._id.toString().hashCode?.() || Date.now()) % 10000).padStart(4, '0');
      cards.push({
        _id: `card_virtual_${user._id}`,
        type: 'virtual',
        cardNumber: generateCardNumber(virtualLast4 + '000000', 'virtual'),
        maskedNumber: maskCardNumber(generateCardNumber(virtualLast4 + '000000', 'virtual')),
        cardHolder: cardHolder,
        expiryDate: '06/27',
        cvv: '***',
        balance: user.savingsBalance || 0,
        status: user.cardStatus?.virtual || 'active',
        lastFour: virtualLast4,
        network: 'visa',
        accountType: 'savings',
      });
    }

    console.log('[Mobile Cards] Returning', cards.length, 'cards for user:', user.email);

    return NextResponse.json({
      success: true,
      cards: cards,
    });

  } catch (error: any) {
    console.error('[Mobile Cards] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cards' },
      { status: 500 }
    );
  }
}

// POST /api/mobile/cards - Request new card
export async function POST(request: NextRequest) {
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
    const { cardType = 'debit' } = body;

    // In production, you'd create a card request record
    // For now, return success
    return NextResponse.json({
      success: true,
      message: `New ${cardType} card request submitted. You will receive it within 5-7 business days.`,
      requestId: `REQ-${Date.now()}`,
    });

  } catch (error: any) {
    console.error('[Mobile Cards] POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to request card' },
      { status: 500 }
    );
  }
}