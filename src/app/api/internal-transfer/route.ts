import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { db } from '@/lib/mongodb';
import User from '@/models/User';
import { sendTransactionEmail } from '@/lib/mail';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { recipientEmail, amount, description } = await request.json();

  if (!recipientEmail || !amount || isNaN(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  try {
    // Ensure recipient exists and is not the sender
    const recipient = await User.findOne({ email: recipientEmail.toLowerCase() });
    if (!recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    }
    if (recipient._id.toString() === session.user.id) {
      return NextResponse.json({ error: 'Cannot transfer to self' }, { status: 400 });
    }

    // 1. Debit sender (type: transfer)
    const { user: senderUser, transaction: debitTxn } = await db.createTransaction(
      session.user.id,
      {
        type: 'transfer',
        amount,
        description: description || `Transfer to ${recipient.name} (${recipient.email})`,
        currency: 'USD',
      },
      'completed'
    );

    // 2. Credit recipient (type: credit)
    const { user: updatedRecipient, transaction: creditTxn } = await db.createTransaction(
      recipient._id.toString(),
      {
        type: 'credit',
        amount,
        description: description || `Transfer from ${senderUser.name} (${senderUser.email})`,
        currency: 'USD',
      },
      'completed'
    );

    // 3. Notify both parties by email
    await sendTransactionEmail(senderUser.email, {
      name: senderUser.name,
      transaction: debitTxn,
    });
    await sendTransactionEmail(updatedRecipient.email, {
      name: updatedRecipient.name,
      transaction: creditTxn,
    });

    return NextResponse.json(
      { message: 'Transfer successful', senderTransaction: debitTxn, recipientTransaction: creditTxn },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Internal transfer error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
