// src/app/api/transactions/transfer/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession }      from 'next-auth';
import { authOptions }           from '@/lib/authOptions';
import { db }                    from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const {
    toEmail,
    toAccountNumber,
    toRoutingNumber,
    amount,
    currency = 'USD',
    description = 'Transfer'
  } = await request.json();

  // Lookup recipient
  let recipient = null;
  if (toEmail) {
    recipient = await db.getUserByEmail(toEmail);
  }
  if (!recipient && toAccountNumber && toRoutingNumber) {
    recipient = await db.getUserByAccount(toAccountNumber, toRoutingNumber);
  }
  if (!recipient) {
    return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
  }

  // Perform a two-leg transfer
  await db.createTransaction(
    session.user.id,
    { type: 'transfer', amount, description, currency },
    'completed'
  );
  await db.createTransaction(
    recipient.id,
    { type: 'transfer', amount, description, currency },
    'completed'
  );

  return NextResponse.json({ success: true });
}
