// File: src/app/api/transactions/transfer/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/User';
import Transaction from '../../../../models/Transaction';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

export async function POST(request: NextRequest) {
  try {
    const { source, destination, amount } = await request.json();
    if (!source || !destination || source === destination || !amount || amount <= 0) {
      return NextResponse.json({ message: 'Invalid transfer data' }, { status: 400 });
    }

    // 1) Identify user via session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // We assume user.balance = checking, user.savings (if exists), and user.btcBalance for BTC.
    // Example: transfer from checking → savings
    if (source === 'checking' && destination === 'savings') {
      if (user.balance < amount) {
        return NextResponse.json({ message: 'Insufficient checking funds' }, { status: 400 });
      }
      // Ensure user has a savings field; if not, initialize:
      if ((user as any).savings === undefined) {
        (user as any).savings = 0;
      }
      user.balance -= amount;
      (user as any).savings += amount;

      await user.save();

      // Create two transaction records: one for debit checking, one for credit savings
      await Transaction.create([
        {
          userId: user._id,
          type: 'transfer_usd',
          currency: 'USD',
          amount: -amount,
          description: `Transfer $${amount.toFixed(2)} from checking to savings`,
        },
        {
          userId: user._id,
          type: 'transfer_usd',
          currency: 'USD',
          amount: amount,
          description: `Transfer $${amount.toFixed(2)} into savings`,
        },
      ]);

      return NextResponse.json({ message: 'Transfer successful' }, { status: 200 });
    }

    if (source === 'savings' && destination === 'checking') {
      // If no savings field or insufficient savings:
      if ((user as any).savings < amount) {
        return NextResponse.json({ message: 'Insufficient savings funds' }, { status: 400 });
      }
      (user as any).savings -= amount;
      user.balance += amount;
      await user.save();

      await Transaction.create([
        {
          userId: user._id,
          type: 'transfer_usd',
          currency: 'USD',
          amount: -amount,
          description: `Transfer $${amount.toFixed(2)} from savings to checking`,
        },
        {
          userId: user._id,
          type: 'transfer_usd',
          currency: 'USD',
          amount: amount,
          description: `Transfer $${amount.toFixed(2)} into checking`,
        },
      ]);

      return NextResponse.json({ message: 'Transfer successful' }, { status: 200 });
    }

    return NextResponse.json(
      { message: 'Unsupported transfer direction' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error in /api/transactions/transfer:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
