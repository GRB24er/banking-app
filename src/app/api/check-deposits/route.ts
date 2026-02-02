import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import CheckDeposit from '@/models/CheckDeposit';
import User from '@/models/User';

const AUTH_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || '308d98ab1034136b95e1f7b43f6afde185e5892d09bbe9d1e2b68e1db9c1acae';

async function verifyToken(request: NextRequest) {
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

// POST - Submit new check deposit
export async function POST(request: NextRequest) {
  console.log('[Check Deposit] POST - New deposit submission');

  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await request.json();
    const { accountType, amount, checkNumber, frontImage, backImage } = body;

    if (!accountType || !amount || !frontImage || !backImage) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
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

    console.log('[Check Deposit] Created deposit:', deposit._id);

    return NextResponse.json({
      success: true,
      deposit: {
        id: deposit._id.toString(),
        accountType: deposit.accountType,
        amount: deposit.amount,
        status: deposit.status,
        createdAt: deposit.createdAt,
      },
      message: 'Check deposit submitted successfully. It will be reviewed within 1-2 business days.',
    });

  } catch (error) {
    console.error('[Check Deposit] POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit check deposit' },
      { status: 500 }
    );
  }
}

// GET - Get user's check deposits
export async function GET(request: NextRequest) {
  console.log('[Check Deposit] GET - Fetching deposits');

  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const query: Record<string, string> = { userId: decoded.userId };
    if (status) {
      query.status = status;
    }

    const deposits = await CheckDeposit.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-frontImage -backImage');

    const total = await CheckDeposit.countDocuments(query);

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
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('[Check Deposit] GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch deposits' },
      { status: 500 }
    );
  }
}
