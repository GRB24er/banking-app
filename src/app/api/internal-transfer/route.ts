// File: src/app/api/user/internal-transfer/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { db } from '@/lib/mongodb';
import User from '@/models/User';
import { sendTransactionEmail } from '@/lib/mail';

export async function POST(request: NextRequest) {
  // 1) Authenticate
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // 2) Validate input
  const { recipientEmail, amount, description } = await request.json();
  const amt = Number(amount);
  if (
    !recipientEmail ||
    isNaN(amt) ||
    amt <= 0
  ) {
    return NextResponse.json(
      { error: 'Invalid input' },
      { status: 400 }
    );
  }

  try {
    // 3) Lookup recipient
    const recipient = await User.findOne({
      email: recipientEmail.toLowerCase()
    });
    if (!recipient) {
      return NextResponse.json(
        { error: 'Recipient not found' },
        { status: 404 }
      );
    }
    if (recipient._id.toString() === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot transfer to self' },
        { status: 400 }
      );
    }

    // 4) Debit sender’s checking account
    //    We now use createAccountTransaction to hit checkingBalance
    const { user: senderUser, transaction: debitTxn } =
      await db.createAccountTransaction(
        session.user.id,
        'checking', // target the checkingBalance field
        {
          type: 'transfer',
          amount: amt,
          description:
            description ||
            `Transfer to ${recipient.name} (${recipient.email})`,
          currency: 'USD',
        },
        'completed'
      );

    // 5) Credit recipient’s checking account
    const { user: updatedRecipient, transaction: creditTxn } =
      await db.createAccountTransaction(
        recipient._id.toString(),
        'checking',
        {
          type: 'credit',
          amount: amt,
          description:
            description ||
            `Transfer from ${senderUser.name} (${senderUser.email})`,
          currency: 'USD',
        },
        'completed'
      );

    // 6) Send notification emails
    await sendTransactionEmail(senderUser.email, {
      name: senderUser.name,
      transaction: debitTxn,
    });
    await sendTransactionEmail(updatedRecipient.email, {
      name: updatedRecipient.name,
      transaction: creditTxn,
    });

    // 7) Return success
    return NextResponse.json(
      {
        message: 'Transfer successful',
        senderTransaction: debitTxn,
        recipientTransaction: creditTxn,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Internal transfer error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
