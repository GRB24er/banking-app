import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { db } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const month = parseInt(url.searchParams.get('month') || '0', 10);
  const year = parseInt(url.searchParams.get('year') || '0', 10);

  if (!month || !year) {
    return NextResponse.json({ error: 'Missing month/year' }, { status: 400 });
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  try {
    const transactions = await db.getTransactions(session.user.id, { startDate, endDate, limit: 100 });

    const inflow = transactions.filter(t => ['deposit', 'credit'].includes(t.type)).reduce((sum, t) => sum + t.amount, 0);
    const outflow = transactions.filter(t => ['withdrawal', 'debit', 'transfer'].includes(t.type)).reduce((sum, t) => sum + t.amount, 0);

    return NextResponse.json({
      user: {
        name: session.user.name,
        email: session.user.email,
        accountNumber: session.user.accountNumber || '',
        btcBalance: session.user.btcBalance,
        balance: session.user.balance,
      },
      period: {
        start: startDate.toDateString(),
        end: endDate.toDateString(),
      },
      inflow,
      outflow,
      transactions
    });
  } catch (err: any) {
    console.error('Statement error:', err);
    return NextResponse.json({ error: 'Failed to generate statement' }, { status: 500 });
  }
}
