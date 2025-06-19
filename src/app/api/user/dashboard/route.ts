// File: src/app/api/user/dashboard/route.ts

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

// Define the shape of a transaction document
interface ITransaction {
  _id: string;
  type: string;
  currency: string;
  amount: number;
  date: Date;
  description: string;
}

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

    // Fetch the 10 most recent transactions
    const transactions: ITransaction[] = await Transaction.find({ userId: user._id })
      .sort({ date: -1 })
      .limit(10)
      .lean();

    const formattedTransactions = transactions.map((txn) => ({
      _id: txn._id.toString(),
      type: txn.type,
      currency: txn.currency,
      amount: txn.amount,
      date: txn.date.toISOString(),         // full ISO timestamp
      description: txn.description,
    }));

    return NextResponse.json({
      user: {
        name:           user.name,
        email:          user.email,
        role:           user.role,
        balance:        user.balance,
        btcBalance:     user.btcBalance,
        accountNumber:  user.accountNumber,
        routingNumber:  user.routingNumber,
        bitcoinAddress: user.bitcoinAddress,
      },
      recent: formattedTransactions,          // ← renamed from `transactions` to `recent`
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
