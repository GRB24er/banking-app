// File: src/app/api/admin/user/[id]/withdraw/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession }        from 'next-auth';
import { authOptions }             from '@/lib/authOptions';
import dbConnect, { db }           from '@/lib/mongodb';
import TransactionModel            from '@/models/Transaction';
import User                        from '@/models/User';
import { sendTransactionEmail }    from '@/lib/mail';

export async function POST(
  request: NextRequest,
  context: any    // ← accept context as any so Next.js ParamCheck passes
) {
  // 1) Auth guard
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2) Validate amount
  const { amount } = await request.json();
  const amt = Number(amount);
  if (isNaN(amt) || amt <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }

  // 3) Connect
  await dbConnect();

  // 4) Pull out the dynamic [id] param
  const userId: string = context.params.id;

  // 5) Branded description
  const description = 'Horizon Global Capital';

  try {
    // 6) Embedded balance update
    const { transaction } = await db.createTransaction(
      userId,
      { type: 'withdrawal', amount: amt, description },
      'completed'
    );

    // 7) Standalone record
    await TransactionModel.create({
      userId,
      type:        'withdrawal',
      amount:      amt,
      currency:    transaction.currency,
      description
    });

    // 8) Notify user by email
    const user = await User.findById(userId);
    if (user) {
      await sendTransactionEmail(user.email, {
        name:        user.name,
        transaction
      });
    }

    // 9) Return success
    return NextResponse.json({ success: true, transaction });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
