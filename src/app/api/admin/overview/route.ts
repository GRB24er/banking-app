import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { db } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const users = await db.getUsers();

    const summary = users.reduce(
      (acc, user) => {
        acc.totalBalance += user.balance;
        acc.totalBTC += user.btcBalance;
        acc.totalUsers += 1;
        if (user.verified) acc.verified += 1;
        return acc;
      },
      { totalBalance: 0, totalBTC: 0, totalUsers: 0, verified: 0 }
    );

    const recent = users.flatMap(u => (u.transactions || []).slice(-1).map(t => ({
      user: u.name,
      email: u.email,
      ...t
    }))).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

    return NextResponse.json({ users, summary, recent });
  } catch (err: any) {
    console.error('Admin overview error:', err);
    return NextResponse.json({ error: 'Failed to load admin overview' }, { status: 500 });
  }
}
