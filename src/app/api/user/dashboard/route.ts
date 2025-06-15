import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  try {
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const transactions = await Transaction.find({ userId: user._id })
      .sort({ date: -1 })
      .limit(10)
      .lean();

    return NextResponse.json({
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        balance: user.balance,
        btcBalance: user.btcBalance,
        accountNumber: user.accountNumber,
        routingNumber: user.routingNumber,
        bitcoinAddress: user.bitcoinAddress,
      },
      transactions: transactions.map(txn => ({
        _id: txn._id.toString(),
        type: txn.type,
        currency: txn.currency,
        amount: txn.amount,
        date: txn.date.toISOString().split('T')[0],
        description: txn.description,
      })),
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}