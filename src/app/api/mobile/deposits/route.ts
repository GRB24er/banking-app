// app/api/mobile/deposits/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import CheckDeposit from '@/models/CheckDeposit';
import Transaction from '@/models/Transaction';

export const runtime = 'nodejs';
export const maxDuration = 60;

const JWT_SECRET =
  process.env.JWT_SECRET ||
  '308d98ab1034136b95e1f7b43f6afde185e5892d09bbe9d1e2b68e1db9c1acae';

async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  try {
    const token = authHeader.split(' ')[1];
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
  } catch {
    return null;
  }
}

// GET /api/mobile/deposits - Get user's deposit history
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: auth.email }).lean();
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const deposits = await CheckDeposit.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({
      success: true,
      deposits: deposits.map((d: any) => ({
        _id: d._id.toString(),
        amount: d.amount,
        accountType: d.accountType,
        status: d.status,
        hasCheckFront: !!d.frontImage,
        hasCheckBack: !!d.backImage,
        createdAt: d.createdAt,
        reviewedAt: d.reviewedAt,
        notes: d.notes,
      })),
    });
  } catch (error: any) {
    console.error('Deposits fetch error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch deposits' },
      { status: 500 }
    );
  }
}

// POST /api/mobile/deposits - Submit new check deposit
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: auth.email }).lean();
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch (parseError: any) {
      console.error('Body parse error:', parseError?.message);
      return NextResponse.json(
        { success: false, error: 'Request too large or invalid. Please try with smaller images.' },
        { status: 413 }
      );
    }

    const { amount, accountType, checkFrontImage, checkBackImage } = body;

    // Validation
    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 });
    }

    if (!['checking', 'savings'].includes(accountType)) {
      return NextResponse.json({ success: false, error: 'Invalid account type' }, { status: 400 });
    }

    // Strip data URI prefix if present
    const stripPrefix = (s: string) => s.replace(/^data:image\/\w+;base64,/, '');
    const frontImg = typeof checkFrontImage === 'string' && checkFrontImage.length > 10
      ? stripPrefix(checkFrontImage).substring(0, 2000)
      : 'placeholder_front';
    const backImg = typeof checkBackImage === 'string' && checkBackImage.length > 10
      ? stripPrefix(checkBackImage).substring(0, 2000)
      : 'placeholder_back';

    const reference = `DEP${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Create deposit using Mongoose model
    const deposit = await CheckDeposit.create({
      userId: (user as any)._id,
      userEmail: auth.email,
      userName: `${(user as any).firstName || ''} ${(user as any).lastName || ''}`.trim() || (user as any).name || 'Unknown',
      amount: Number(amount),
      accountType,
      frontImage: frontImg,
      backImage: backImg,
      status: 'pending',
    });

    // Also create a transaction record
    await Transaction.create({
      userId: (user as any)._id,
      type: 'deposit',
      amount: Number(amount),
      description: `Mobile Check Deposit - ${reference}`,
      accountType,
      status: 'pending',
      reference,
      posted: false,
      date: new Date(),
      channel: 'mobile',
      origin: 'check_deposit',
      metadata: { depositId: deposit._id.toString() },
    });

    return NextResponse.json({
      success: true,
      message: 'Check deposit submitted for review',
      deposit: {
        _id: deposit._id.toString(),
        reference,
        amount: Number(amount),
        accountType,
        status: 'pending',
        createdAt: deposit.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Deposit submit error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to submit deposit' },
      { status: 500 }
    );
  }
}
