// src/app/api/transactions/deposit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { db } from '@/lib/mongodb';
import { sendTransactionEmail } from '@/lib/mail';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { amount, description } = await request.json();
  if (!amount || isNaN(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }

  try {
    const { user, transaction } = await db.createTransaction(
      session.user.id,
      {
        type: 'deposit',
        amount,
        description: description || 'Deposit via portal',
        currency: 'USD',
      },
      'completed' // ensure status
    );

    // Email confirmation
    await sendTransactionEmail(user.email, {
      name: user.name,
      transaction,
    });

    return NextResponse.json({ message: 'Deposit successful', transaction }, { status: 201 });
  } catch (err: any) {
    console.error('Deposit error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
