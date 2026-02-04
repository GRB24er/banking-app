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
    wireType?: string;
    wireFee?: number;
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
    console.log('[Mobile Wire Transfer] POST');

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
      recipientRoutingNumber,
      recipientBankAddress,
      recipientAddress,
      amount,
      description,
      wireType = 'domestic',
      purposeOfTransfer,
      urgentTransfer = false
    } = body;

    // Validation
    const missingFields = [];
    if (!recipientName?.trim()) missingFields.push('recipientName');
    if (!recipientAccount?.trim()) missingFields.push('recipientAccount');
    if (!recipientBank?.trim()) missingFields.push('recipientBank');
    if (!recipientRoutingNumber?.trim()) missingFields.push('recipientRoutingNumber');
    if (!recipientBankAddress?.trim()) missingFields.push('recipientBankAddress');
    if (!amount) missingFields.push('amount');

    if (missingFields.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      }, { status: 400 });
    }

    const transferAmount = Math.abs(
      typeof amount === 'string' 
        ? parseFloat(amount.replace(/[^0-9.-]/g, '')) 
        : Number(amount)
    );

    if (isNaN(transferAmount) || transferAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 });
    }

    if (transferAmount < 100) {
      return NextResponse.json({ success: false, error: 'Minimum wire transfer is $100' }, { status: 400 });
    }

    if (transferAmount > 250000) {
      return NextResponse.json({ success: false, error: 'Wire transfers over $250,000 require additional approval' }, { status: 400 });
    }

    // Calculate fees
    let wireFee = wireType === 'international' ? 45 : 30;
    if (urgentTransfer) wireFee += 25;
    const totalAmount = transferAmount + wireFee;

    await connectDB();

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const balanceFieldMap: Record<string, string> = {
      'checking': 'checkingBalance',
      'savings': 'savingsBalance',
      'investment': 'investmentBalance'
    };

    const fromBalanceField = balanceFieldMap[fromAccount];
    const currentBalance = Number((user as any)[fromBalanceField] || 0);

    if (totalAmount > currentBalance) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient funds',
        details: {
          available: currentBalance,
          transferAmount,
          fee: wireFee,
          totalRequired: totalAmount
        }
      }, { status: 400 });
    }

    // Generate reference
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const wireRef = `WIRE-${timestamp}-${random}`;

    // Create wire transaction
    await Transaction.create({
      userId: user._id,
      type: 'transfer-out',
      currency: 'USD',
      amount: transferAmount,
      description: description?.trim() || `${wireType === 'international' ? 'International' : 'Domestic'} wire to ${recipientName}`,
      status: 'processing',
      accountType: fromAccount,
      posted: false,
      reference: wireRef,
      channel: 'mobile',
      origin: 'wire_transfer',
      date: new Date(),
      metadata: {
        wireType,
        recipientName,
        recipientAccount: recipientAccount.slice(-4),
        recipientBank,
        recipientRoutingNumber: recipientRoutingNumber.slice(-4),
        recipientBankAddress,
        recipientAddress,
        purposeOfTransfer,
        urgentTransfer,
        wireFee,
        totalAmount
      }
    });

    // Create fee transaction
    if (wireFee > 0) {
      await Transaction.create({
        userId: user._id,
        type: 'fee',
        currency: 'USD',
        amount: wireFee,
        description: `Wire transfer fee${urgentTransfer ? ' (urgent)' : ''}`,
        status: 'processing',
        accountType: fromAccount,
        posted: false,
        reference: `${wireRef}-FEE`,
        channel: 'mobile',
        origin: 'wire_transfer',
        date: new Date(),
        metadata: { linkedReference: wireRef }
      });
    }

    console.log('[Mobile Wire Transfer] Created:', wireRef);

    return NextResponse.json({
      success: true,
      message: 'Wire transfer initiated successfully',
      reference: wireRef,
      transfer: {
        type: 'wire',
        wireType,
        from: fromAccount,
        recipient: {
          name: recipientName,
          account: `****${recipientAccount.slice(-4)}`,
          bank: recipientBank
        },
        amount: transferAmount,
        fee: wireFee,
        total: totalAmount,
        status: 'processing',
        urgentTransfer,
        estimatedCompletion: urgentTransfer ? 'Same business day' : '1-2 business days',
        date: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('[Mobile Wire Transfer] Error:', error);
    return NextResponse.json({ success: false, error: 'Wire transfer failed' }, { status: 500 });
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
      origin: 'wire_transfer',
      type: 'transfer-out'
    }).sort({ date: -1 }).limit(20);

    return NextResponse.json({
      success: true,
      transfers: transfers.map((t: TransactionDoc) => ({
        id: t._id.toString(),
        reference: t.reference,
        amount: t.amount,
        fee: t.metadata?.wireFee || 0,
        status: t.status,
        wireType: t.metadata?.wireType,
        recipient: t.metadata?.recipientName,
        date: t.date
      }))
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch transfers' }, { status: 500 });
  }
}
