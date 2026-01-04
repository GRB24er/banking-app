import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

const JWT_SECRET = 'b3bc4dcf9055e490cef86fd9647fc8acd61d6bbe07dfb85fb6848bfe7f4f3926';

async function getMobileUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  console.log('[Mobile Dashboard] Auth header present:', !!authHeader);
  
  if (!authHeader?.startsWith('Bearer ')) {
    console.log('[Mobile Dashboard] No Bearer token');
    return null;
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    console.log('[Mobile Dashboard] Token verified for:', decoded.email);
    return decoded;
  } catch (error: any) {
    console.log('[Mobile Dashboard] Token verification failed:', error.message);
    return null;
  }
}

export async function GET(request: NextRequest) {
  console.log('[Mobile Dashboard] GET request received');
  
  try {
    const decoded = await getMobileUser(request);
    
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();
    console.log('[Mobile Dashboard] Database connected');

    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      console.log('[Mobile Dashboard] User not found:', decoded.userId);
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('[Mobile Dashboard] User found:', user.email);

    let transactions: any[] = [];
    try {
      transactions = await Transaction.find({ userId: user._id })
        .sort({ date: -1, createdAt: -1 })
        .limit(20)
        .lean();
      console.log('[Mobile Dashboard] Transactions:', transactions.length);
    } catch (txError) {
      console.error('[Mobile Dashboard] Transaction error:', txError);
    }

    const formattedTransactions = transactions.map((tx: any) => {
      let adjustedAmount = tx.amount;
      const isDebit = ['transfer-out', 'withdrawal', 'payment', 'fee', 'charge', 'purchase'].includes(tx.type);
      
      if (tx.origin === 'internal_transfer') {
        if (tx.reference?.includes('-OUT')) {
          adjustedAmount = -Math.abs(tx.amount);
        } else if (tx.reference?.includes('-IN')) {
          adjustedAmount = Math.abs(tx.amount);
        }
      } else if (isDebit) {
        adjustedAmount = -Math.abs(tx.amount);
      } else {
        adjustedAmount = Math.abs(tx.amount);
      }

      return {
        _id: tx._id.toString(),
        reference: tx.reference,
        type: tx.type,
        amount: adjustedAmount,
        rawAmount: tx.amount,
        description: tx.description,
        status: tx.status,
        date: tx.date || tx.createdAt,
        createdAt: tx.createdAt,
        accountType: tx.accountType,
        posted: tx.posted,
      };
    });

    const nameParts = (user.name || '').split(' ');

    return NextResponse.json({
      success: true,
      balances: {
        checking: user.checkingBalance || 0,
        savings: user.savingsBalance || 0,
        investment: user.investmentBalance || 0,
        total: (user.checkingBalance || 0) + (user.savingsBalance || 0) + (user.investmentBalance || 0),
      },
      transactions: formattedTransactions,
      user: {
        id: user._id.toString(),
        name: user.name,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: user.email,
        accountNumber: user.accountNumber,
        routingNumber: user.routingNumber,
      }
    });

  } catch (error: any) {
    console.error('[Mobile Dashboard] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load dashboard' },
      { status: 500 }
    );
  }
}