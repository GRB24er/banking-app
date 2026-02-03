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
    console.log('[Mobile International Transfer] POST');

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
      swiftCode,
      iban,
      recipientCountry,
      recipientAddress,
      recipientBankAddress,
      amount,
      currency = 'USD',
      description,
      purposeOfTransfer,
      transferSpeed = 'standard'
    } = body;

    // Validation
    const missingFields = [];
    if (!recipientName?.trim()) missingFields.push('recipientName');
    if (!recipientAccount?.trim()) missingFields.push('recipientAccount');
    if (!recipientBank?.trim()) missingFields.push('recipientBank');
    if (!swiftCode?.trim()) missingFields.push('swiftCode');
    if (!recipientCountry?.trim()) missingFields.push('recipientCountry');
    if (!amount) missingFields.push('amount');

    if (missingFields.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      }, { status: 400 });
    }

    // Validate SWIFT code
    if (!/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/i.test(swiftCode)) {
      return NextResponse.json({ success: false, error: 'Invalid SWIFT/BIC code format' }, { status: 400 });
    }

    const transferAmount = Math.abs(
      typeof amount === 'string' 
        ? parseFloat(amount.replace(/[^0-9.-]/g, '')) 
        : Number(amount)
    );

    if (isNaN(transferAmount) || transferAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 });
    }

    if (transferAmount < 50) {
      return NextResponse.json({ success: false, error: 'Minimum international transfer is $50' }, { status: 400 });
    }

    if (transferAmount > 100000) {
      return NextResponse.json({ success: false, error: 'Transfers over $100,000 require additional approval' }, { status: 400 });
    }

    // Calculate fees
    let transferFee = 45;
    let exchangeFee = 0;
    if (currency !== 'USD') {
      exchangeFee = Math.max(10, transferAmount * 0.01);
    }
    if (transferSpeed === 'express') {
      transferFee += 30;
    }
    const totalFees = transferFee + exchangeFee;
    const totalAmount = transferAmount + totalFees;

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
          fees: totalFees,
          totalRequired: totalAmount
        }
      }, { status: 400 });
    }

    // Generate reference
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const intlRef = `INTL-${timestamp}-${random}`;

    // Create pending international transaction
    const intlTransaction = await Transaction.create({
      userId: user._id,
      type: 'transfer-out',
      currency: 'USD',
      amount: transferAmount,
      description: description?.trim() || `International transfer to ${recipientName} (${recipientCountry})`,
      status: 'pending',
      accountType: fromAccount,
      posted: false,
      reference: intlRef,
      channel: 'mobile',
      origin: 'international_transfer',
      date: new Date(),
      metadata: {
        recipientName,
        recipientAccount: recipientAccount.slice(-4),
        recipientBank,
        swiftCode,
        iban: iban?.slice(-4),
        recipientCountry,
        recipientAddress,
        recipientBankAddress,
        targetCurrency: currency,
        purposeOfTransfer,
        transferSpeed,
        transferFee,
        exchangeFee,
        totalFees,
        totalAmount
      }
    });

    // Create fee transaction
    if (totalFees > 0) {
      await Transaction.create({
        userId: user._id,
        type: 'fee',
        currency: 'USD',
        amount: totalFees,
        description: `International transfer fees`,
        status: 'pending',
        accountType: fromAccount,
        posted: false,
        reference: `${intlRef}-FEE`,
        channel: 'mobile',
        origin: 'international_transfer',
        date: new Date(),
        metadata: { linkedReference: intlRef }
      });
    }

    console.log('[Mobile International Transfer] Created:', intlRef);

    return NextResponse.json({
      success: true,
      message: 'International transfer initiated. Awaiting admin approval.',
      reference: intlRef,
      transfer: {
        type: 'international',
        from: fromAccount,
        recipient: {
          name: recipientName,
          account: `****${recipientAccount.slice(-4)}`,
          bank: recipientBank,
          country: recipientCountry
        },
        amount: transferAmount,
        currency,
        fees: {
          transfer: transferFee,
          exchange: exchangeFee,
          total: totalFees
        },
        total: totalAmount,
        status: 'pending',
        estimatedCompletion: transferSpeed === 'express' ? '1-2 business days' : '3-5 business days',
        date: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('[Mobile International Transfer] Error:', error);
    return NextResponse.json({ success: false, error: 'International transfer failed' }, { status: 500 });
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
      origin: 'international_transfer',
      type: 'transfer-out'
    }).sort({ date: -1 }).limit(20);

    return NextResponse.json({
      success: true,
      transfers: transfers.map(t => ({
        id: t._id.toString(),
        reference: t.reference,
        amount: t.amount,
        fees: t.metadata?.totalFees || 0,
        status: t.status,
        recipient: t.metadata?.recipientName,
        country: t.metadata?.recipientCountry,
        date: t.date
      }))
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch transfers' }, { status: 500 });
  }
}
