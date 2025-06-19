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
    return NextResponse.json({ error: 'Invalid withdrawal amount' }, { status: 400 });
  }

  try {
    const { user, transaction } = await db.createTransaction(
      session.user.id,
      {
        type: 'withdrawal',
        amount,
        description: description || 'ATM Withdrawal',
        currency: 'USD',
      },
      'completed'
    );

    await sendTransactionEmail(user.email, {
      name: user.name,
      transaction,
    });

    return NextResponse.json({ message: 'Withdrawal successful', transaction }, { status: 201 });
  } catch (err: any) {
    console.error('Withdrawal error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
