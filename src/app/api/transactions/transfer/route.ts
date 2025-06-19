// File: src/app/api/transactions/transfer/route.ts
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

    const { bitcoinAddress, amount, description } = await request.json();
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ message: 'Invalid amount' }, { status: 400 });
    }

    await dbConnect();
    const recipient = await db.getUserByBitcoinAddress(bitcoinAddress);
    if (!recipient) {
      return NextResponse.json(
        { message: 'Recipient Bitcoin address not found' },
        { status: 404 }
      );
    }

    const { transaction: senderTx } = await db.createBitcoinTransaction(
      senderId,
      { type: 'withdrawal', amount, description: description || `BTC transfer to ${bitcoinAddress}` },
      'completed'
    );
    const { transaction: recipientTx } = await db.createBitcoinTransaction(
      recipient.id as string,
      { type: 'credit', amount, description: description || `BTC received from ${senderId}` },
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
      console.error('BTC email error:', e);
    }

    return NextResponse.json({ senderTransaction: senderTx, recipientTransaction: recipientTx });
  } catch (err: any) {
    console.error('Transfer API error:', err);
    const msg = err.message || 'Internal server error';
    const status = msg.includes('Insufficient') ? 400 : 500;
    return NextResponse.json({ message: msg }, { status });
  }
}
