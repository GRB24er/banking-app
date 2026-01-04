import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET!;

async function getMobileUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const decoded = await getMobileUser(request);
    
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

    const transactions = await Transaction.find({ userId: user._id })
      .sort({ date: -1, createdAt: -1 })
      .limit(20)
      .lean();

    const formattedTransactions = (transactions as any[]).map((tx) => {
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

  } catch (error) {
    console.error('Mobile dashboard error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load dashboard' },
      { status: 500 }
    );
  }
}