import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { amount, description } = await request.json();
    const numericAmount = Number(amount);
    
    if (isNaN(numericAmount) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const user = await db.getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updatedUser = await db.updateBalance(
      user._id.toString(),
      numericAmount,
      {
        type: 'deposit',
        description: description || 'Deposit'
      }
    );

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Deposit failed' },
      { status: 500 }
    );
  }
}