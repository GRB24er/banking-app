import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

const AUTH_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || '308d98ab1034136b95e1f7b43f6afde185e5892d09bbe9d1e2b68e1db9c1acae';

interface DecodedToken {
  userId: string;
  email: string;
}

interface TransactionDoc {
  _id: { toString: () => string };
  reference: string;
  amount: number;
  status: string;
  date: Date;
  metadata?: {
    recipientName?: string;
    recipientBank?: string;
  };
}

async function verifyToken(request: NextRequest): Promise<DecodedToken | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.split(' ')[1];
    return jwt.verify(token, AUTH_SECRET) as DecodedToken;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Mobile Domestic Transfer] POST - ACH Transfer');

    const decoded = await verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      fromAccount = 'checking',
      recipientName,
      recipientAccount,
      recipientBank,
      routingNumber,
      recipientEmail,
      recipientPhone,
      amount,
      description
    } = body;

    // Validation
    if (!recipientName?.trim()) {
      return NextResponse.json({ success: false, error: 'Recipient name is required' }, { status: 400 });
    }
    if (!recipientAccount?.trim()) {
      return NextResponse.json({ success: false, error: 'Account number is required' }, { status: 400 });
    }
    if (!routingNumber?.trim() || routingNumber.length !== 9) {
      return NextResponse.json({ success: false, error: 'Valid 9-digit routing number is required' }, { status: 400 });
    }
    if (!recipientBank?.trim()) {
      return NextResponse.json({ success: false, error: 'Bank name is required' }, { status: 400 });
    }

    const transferAmount = Math.abs(
      typeof amount === 'string' 
        ? parseFloat(amount.replace(/[^0-9.-]/g, '')) 
        : Number(amount)
    );

    if (isNaN(transferAmount) || transferAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid transfer amount' }, { status: 400 });
    }

    if (transferAmount > 25000) {
      return NextResponse.json({ success: false, error: 'ACH transfers are limited to $25,000 per transaction' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 });
    }

    const balanceFieldMap: Record<string, string> = {
      'checking': 'checkingBalance',
      'savings': 'savingsBalance',
      'investment': 'investmentBalance'
    };

    const fromBalanceField = balanceFieldMap[fromAccount];
    const currentBalance = Number((user as any)[fromBalanceField] || 0);

    if (transferAmount > currentBalance) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient funds',
        available: currentBalance
      }, { status: 400 });
    }

    // Generate reference
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const achRef = `ACH-${timestamp}-${random}`;

    // Create ACH transaction
    await Transaction.create({
      userId: user._id,
      type: 'transfer-out',
      currency: 'USD',
      amount: transferAmount,
      description: description?.trim() || `ACH Transfer to ${recipientName}`,
      status: 'processing',
      accountType: fromAccount,
      posted: false,
      reference: achRef,
      channel: 'mobile',
      origin: 'ach_transfer',
      date: new Date(),
      metadata: {
        transferType: 'domestic_ach',
        recipientName,
        recipientAccount: recipientAccount.slice(-4),
        recipientBank,
        routingNumber: routingNumber.slice(-4),
        recipientEmail: recipientEmail || null,
        recipientPhone: recipientPhone || null,
        estimatedDelivery: '1-3 business days'
      }
    });

    console.log('[Mobile Domestic Transfer] Created:', achRef);

    return NextResponse.json({
      success: true,
      message: 'ACH transfer initiated successfully',
      reference: achRef,
      transfer: {
        type: 'domestic',
        method: 'ACH',
        from: fromAccount,
        recipient: {
          name: recipientName,
          account: `****${recipientAccount.slice(-4)}`,
          bank: recipientBank,
          routing: `****${routingNumber.slice(-4)}`
        },
        amount: transferAmount,
        fee: 0,
        total: transferAmount,
        status: 'processing',
        estimatedDelivery: '1-3 Business Days',
        date: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('[Mobile Domestic Transfer] Error:', error);
    return NextResponse.json({ success: false, error: 'Unable to process transfer' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const transfers = await Transaction.find({
      userId: decoded.userId,
      origin: 'ach_transfer',
      type: 'transfer-out'
    }).sort({ date: -1 }).limit(20);

    return NextResponse.json({
      success: true,
      transfers: transfers.map((t: TransactionDoc) => ({
        id: t._id.toString(),
        reference: t.reference,
        amount: t.amount,
        status: t.status,
        recipient: t.metadata?.recipientName,
        bank: t.metadata?.recipientBank,
        date: t.date
      }))
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch transfers' }, { status: 500 });
  }
}
