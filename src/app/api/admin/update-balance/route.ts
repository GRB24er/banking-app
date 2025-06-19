import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { db } from '@/lib/mongodb';
import { sendTransactionEmail } from '@/lib/mail';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { userId, amount, type, currency, description } = await req.json();

  if (!userId || !amount || !type || !currency) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const transactionType = type === 'credit' ? 'credit' : 'debit';

  try {
    const { user, transaction } = await db.createTransaction(userId, {
      type: transactionType,
      amount: Number(amount),
      description: description || 'Admin adjustment',
      currency,
    });

    await sendTransactionEmail(user.email, {
      name: user.name,
      transaction,
    });

    return NextResponse.json({ success: true, user, transaction });
  } catch (err: any) {
    console.error('Admin balance update error:', err);
    return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 });
  }
}
