import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { type, amount, interval, description } = await request.json();
  if (!['debit', 'credit'].includes(type) || !['daily', 'weekly', 'monthly'].includes(interval) || amount <= 0) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  await dbConnect();
  const user = await User.findById(session.user.id);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  user.recurring.push({
    type,
    amount,
    interval,
    description: description || `${type} scheduled transaction`,
    lastRun: null,
  });

  await user.save();
  return NextResponse.json({ message: 'Recurring transaction created successfully' }, { status: 201 });
}
