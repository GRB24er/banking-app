// File: src/app/api/transactions/send/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession }      from 'next-auth'; 
import { authOptions }           from '@/lib/authOptions';
import { db }                    from '@/lib/mongodb';                          // embedded-transaction + balance updates
import TransactionModel          from '@/models/Transaction';                   // ← new: standalone collection
import { sendTransactionEmail }  from '@/lib/mail';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    console.error('❌ send: no session user');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1) Decode + validate payload
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
  } = body;
  const amt = Number(amount);
  if (isNaN(amt) || amt <= 0) {
    console.error('❌ send: missing or invalid amount:', amount);
    return NextResponse.json({ error: 'Amount is required and must be a number' }, { status: 400 });
  }
  if (!email && !(accountNumber && routingNumber)) {
    console.error('❌ send: no recipient identifier provided:', { email, accountNumber, routingNumber });
    return NextResponse.json({ error: 'Must provide an email or accountNumber + routingNumber' }, { status: 400 });
  }

  // 2) Lookup sender + recipient
  // ── sender (for description use) 
  const sender = await db.getUserById(session.user.id);
  if (!sender) {
    console.error('❌ send: sender not found');
    return NextResponse.json({ error: 'Sender not found' }, { status: 404 });
  }
  // ── recipient
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

  // 3) Build plain descriptions (front-end will prepend "Sent $X to …" automatically)
  const toIdentifier   = email ? recipient.email         : recipient.accountNumber;
  const fromIdentifier = sender.email  || sender.accountNumber;

  try {
    // 4a) Debit sender (embedded + balance)
    const { transaction: debitTx } = await db.createTransaction(
      session.user.id,
      { type: 'withdrawal', amount: amt, description: toIdentifier, currency },
      'completed'
    );

    // 4b) Credit recipient (embedded + balance)
    const { transaction: creditTx } = await db.createTransaction(
      recipient.id,
      { type: 'deposit', amount: amt, description: fromIdentifier, currency },
      'completed'
    );

    console.log('✅ send: embedded transactions created', {
      from: session.user.id, to: recipient.id,
      debitRef: debitTx.reference, creditRef: creditTx.reference,
    });

    // 5) ALSO record in standalone Transaction collection
    await TransactionModel.create({
      userId: session.user.id,
      type:     'send',           // matches your dashboard’s APITransaction type union :contentReference[oaicite:0]{index=0}
      currency,
      amount:   amt,
      description: toIdentifier,
      // date defaults to `new Date()` per your TransactionSchema :contentReference[oaicite:1]{index=1}
    });
    await TransactionModel.create({
      userId: recipient.id,
      type:     'deposit',
      currency,
      amount:   amt,
      description: fromIdentifier,
    });

    // 6) Notify recipient by email
    try {
      await sendTransactionEmail(recipient.email, { name: recipient.name, transaction: creditTx });
      console.log('📧 send: notification email sent to', recipient.email);
    } catch (emailErr) {
      console.error('❌ send: failed notification email:', emailErr);
    }

    // 7) Return success + both legs
    return NextResponse.json({
      success: true,
      debit:   debitTx,
      credit:  creditTx
    });
  } catch (err: any) {
    console.error('❌ send: db.createTransaction error:', err.message);
    const status = err.message.includes('Insufficient') ? 402 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
