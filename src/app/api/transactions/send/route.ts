// File: src/app/api/transactions/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/User';
import Transaction from '../../../../models/Transaction';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

export async function POST(request: NextRequest) {
  try {
    const { recipientEmail, amount } = await request.json();
    if (!recipientEmail || !amount || amount <= 0) {
      return NextResponse.json({ message: 'Invalid request data' }, { status: 400 });
    }

    // 1) Identify sender via session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const sender = await User.findOne({ email: session.user.email });
    if (!sender) {
      return NextResponse.json({ message: 'Sender not found' }, { status: 404 });
    }
    if (sender.balance < amount) {
      return NextResponse.json({ message: 'Insufficient balance' }, { status: 400 });
    }

    const recipient = await User.findOne({ email: recipientEmail });
    if (!recipient) {
      return NextResponse.json({ message: 'Recipient not found' }, { status: 404 });
    }

    // 2) Debit sender and credit recipient
    sender.balance -= amount;
    recipient.balance += amount;
    await sender.save();
    await recipient.save();

    // 3) Create transaction records
    await Transaction.create([
      {
        userId: sender._id,
        type: 'send',
        currency: 'USD',
        amount: -amount,
        description: `Sent $${amount.toFixed(2)} to ${recipientEmail}`,
      },
      {
        userId: recipient._id,
        type: 'deposit',
        currency: 'USD',
        amount: amount,
        description: `Received $${amount.toFixed(2)} from ${sender.email}`,
      },
    ]);

    return NextResponse.json({ message: 'Money sent successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error in /api/transactions/send:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
