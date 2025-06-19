// src/app/api/transactions/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession }      from 'next-auth';
import { authOptions }           from '@/lib/authOptions';
import { db }                    from '@/lib/mongodb';
import { sendTransactionEmail }  from '@/lib/mail';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    console.error('❌ send: no session user');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch (err) {
    console.error('❌ send: invalid JSON', err);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const {
    email,
    accountNumber,
    routingNumber,
    amount,
    currency = 'USD',
    description = 'Transfer'
  } = body;

  // Validate input
  if (!amount || isNaN(Number(amount))) {
    console.error('❌ send: missing or invalid amount:', amount);
    return NextResponse.json({ error: 'Amount is required and must be a number' }, { status: 400 });
  }

  if (!email && !(accountNumber && routingNumber)) {
    console.error('❌ send: no recipient identifier provided:', { email, accountNumber, routingNumber });
    return NextResponse.json({ error: 'Must provide an email or accountNumber + routingNumber' }, { status: 400 });
  }

  let recipient;
  try {
    recipient = await db.findUser({ email, accountNumber, routingNumber });
  } catch (err: any) {
    console.error('❌ send: findUser error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  if (!recipient) {
    console.error('❌ send: recipient not found with', { email, accountNumber, routingNumber });
    return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
  }

  // Perform the two legs inside a try/catch so we can see failures
  try {
    // Debit sender
    const { transaction: debitTx } = await db.createTransaction(
      session.user.id,
      { type: 'withdrawal', amount: Number(amount), description, currency },
      'completed'
    );

    // Credit recipient
    const { transaction: creditTx } = await db.createTransaction(
      recipient.id,
      { type: 'deposit', amount: Number(amount), description, currency },
      'completed'
    );

    console.log('✅ send: transactions created', {
      from: session.user.id,
      to: recipient.id,
      debitRef: debitTx.reference,
      creditRef: creditTx.reference,
    });

    // Fire off notification email (optional)
    try {
      await sendTransactionEmail(recipient.email, { name: recipient.name, transaction: creditTx });
      console.log('📧 send: notification email sent to', recipient.email);
    } catch (emailErr) {
      console.error('❌ send: failed notification email:', emailErr);
    }

    return NextResponse.json({
      success: true,
      debit: debitTx,
      credit: creditTx
    });
  } catch (err: any) {
    console.error('❌ send: db.createTransaction error:', err.message);
    const status = err.message.includes('Insufficient') ? 402 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
