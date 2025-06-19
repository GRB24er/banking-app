// File: src/app/api/transactions/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import dbConnect, { db } from '@/lib/mongodb';
import { sendTransactionEmail } from '@/lib/mail';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const senderId = session.user.id;

    const {
      recipientEmail,
      recipientAccountNumber,
      recipientRoutingNumber,
      amount,
      description
    } = await request.json();

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ message: 'Invalid amount' }, { status: 400 });
    }

    await dbConnect();
    let recipient = null;
    if (recipientEmail) {
      recipient = await db.getUserByEmail(recipientEmail);
    } else {
      recipient = await db.getUserByAccount(
        recipientAccountNumber,
        recipientRoutingNumber
      );
    }

    if (!recipient) {
      return NextResponse.json(
        { message: 'Recipient not found' },
        { status: 404 }
      );
    }

    const { transaction: senderTx } = await db.createTransaction(
      senderId,
      {
        type: 'transfer',
        amount,
        description: description || `Transfer to ${recipient.id}`,
        relatedUser: recipient.id,
        currency: 'USD'
      },
      'completed'
    );

    const { transaction: recipientTx } = await db.createTransaction(
      recipient.id as string,
      {
        type: 'credit',
        amount,
        description: description || `Received from ${senderId}`,
        relatedUser: senderId,
        currency: 'USD'
      },
      'completed'
    );

    try {
      await sendTransactionEmail(
        session.user.email!,
        { name: session.user.name || 'Customer' },
        { type: senderTx.type, amount: senderTx.amount, date: senderTx.date, description: senderTx.description }
      );
      await sendTransactionEmail(
        recipient.email,
        { name: recipient.name },
        { type: recipientTx.type, amount: recipientTx.amount, date: recipientTx.date, description: recipientTx.description }
      );
    } catch (e) {
      console.error('Email send error:', e);
    }

    return NextResponse.json({ senderTransaction: senderTx, recipientTransaction: recipientTx });
  } catch (err: any) {
    console.error('Send API error:', err);
    const msg = err.message || 'Internal server error';
    const status = msg.includes('Insufficient') ? 400 : 500;
    return NextResponse.json({ message: msg }, { status });
  }
}
