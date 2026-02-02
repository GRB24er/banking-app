import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';

const AUTH_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || '308d98ab1034136b95e1f7b43f6afde185e5892d09bbe9d1e2b68e1db9c1acae';

interface DecodedToken {
  userId: string;
  email: string;
}

interface TransactionDoc {
  _id: { toString: () => string };
  type: string;
  amount: number;
  description: string;
  date: Date;
  status?: string;
  accountType: string;
  reference?: string;
  balanceAfter?: number;
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

export async function GET(request: NextRequest) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const accountType = searchParams.get('accountType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const query: Record<string, string> = { userId: decoded.userId };
    if (accountType) query.accountType = accountType;

    const transactions = await Transaction.find(query)
      .sort({ date: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Transaction.countDocuments(query);

    return NextResponse.json({
      success: true,
      transactions: transactions.map((t: TransactionDoc) => ({
        id: t._id.toString(),
        type: t.type,
        amount: t.amount,
        description: t.description,
        date: t.date,
        status: t.status || 'completed',
        accountType: t.accountType,
        reference: t.reference,
        balanceAfter: t.balanceAfter,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[Mobile Transactions] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch transactions' }, { status: 500 });
  }
}
