import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import CheckDeposit from '@/models/CheckDeposit';
import User from '@/models/User';

const AUTH_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || '308d98ab1034136b95e1f7b43f6afde185e5892d09bbe9d1e2b68e1db9c1acae';

async function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  console.log('[Check Deposit] Auth header:', authHeader ? 'Present' : 'Missing');
  
  if (!authHeader?.startsWith('Bearer ')) {
    console.log('[Check Deposit] No Bearer token');
    return null;
  }
  
  try {
    const token = authHeader.split(' ')[1];
    console.log('[Check Deposit] Token length:', token.length);
    const decoded = jwt.verify(token, AUTH_SECRET) as { userId: string; email: string };
    console.log('[Check Deposit] Decoded userId:', decoded.userId);
    return decoded;
  } catch (err: any) {
    console.log('[Check Deposit] JWT verify error:', err.message);
    return null;
  }
}

export async function POST(request: NextRequest) {
  console.log('[Check Deposit] POST - New deposit submission');

  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { accountType, amount, checkNumber, frontImage, backImage } = body;

    if (!accountType || !amount || !frontImage || !backImage) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const deposit = await CheckDeposit.create({
      userId: user._id,
      userEmail: user.email,
      userName: user.name,
      accountType,
      amount: parseFloat(amount),
      checkNumber,
      frontImage,
      backImage,
      status: 'pending',
    });

    return NextResponse.json({
      success: true,
      deposit: {
        id: deposit._id.toString(),
        accountType: deposit.accountType,
        amount: deposit.amount,
        status: deposit.status,
        createdAt: deposit.createdAt,
      },
      message: 'Check deposit submitted successfully.',
    });
  } catch (error: any) {
    console.error('[Check Deposit] POST Error:', error.message);
    return NextResponse.json({ success: false, error: 'Failed to submit check deposit' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const deposits = await CheckDeposit.find({ userId: decoded.userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('-frontImage -backImage');

    return NextResponse.json({
      success: true,
      deposits: deposits.map(d => ({
        id: d._id.toString(),
        accountType: d.accountType,
        amount: d.amount,
        checkNumber: d.checkNumber,
        status: d.status,
        rejectionReason: d.rejectionReason,
        createdAt: d.createdAt,
        reviewedAt: d.reviewedAt,
      })),
    });
  } catch (error) {
    console.error('[Check Deposit] GET Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch deposits' }, { status: 500 });
  }
}
