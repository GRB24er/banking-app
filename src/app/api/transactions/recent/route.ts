// File: src/app/api/transactions/recent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import Transaction from '../../../../models/Transaction';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    // 1) Identify the logged-in user via NextAuth session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const userEmail = session.user.email;
    const user = await (await import('../../../../models/User')).default.findOne({ email: userEmail });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // 2) Fetch the 20 most recent transactions for this user
    const recentTxns = await Transaction.find({ userId: user._id })
      .sort({ date: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({ transactions: recentTxns }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching recent transactions:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
