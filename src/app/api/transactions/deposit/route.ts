// File: src/app/api/transactions/deposit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/User';
import Transaction from '../../../../models/Transaction';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  try {
    const { amount } = await request.json();
    if (!amount || amount <= 0) {
      return NextResponse.json({ message: 'Invalid amount' }, { status: 400 });
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

    // 2) Update the user’s USD balance
    user.balance += amount;
    await user.save();

    // 3) Create a transaction record
    await Transaction.create({
      userId: user._id,
      type: 'deposit',
      currency: 'USD',
      amount: amount,
      description: 'Deposit to checking account',
    });

    return NextResponse.json(
      { message: 'Deposit successful', newBalance: user.balance },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in /api/transactions/deposit:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
