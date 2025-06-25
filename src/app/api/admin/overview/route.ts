// File: src/app/api/admin/overview/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession }        from 'next-auth';
import { authOptions }             from '@/lib/authOptions';
import dbConnect                   from '@/lib/mongodb';
import User                        from '@/models/User';
import Transaction                 from '@/models/Transaction';

interface OverviewSummary {
  totalBalance: number;
  totalBTC:     number;
  totalUsers:   number;
  verified:     number;
}

interface UserListItem {
  id:    string;
  name:  string;
  email: string;
  role:  'user' | 'admin';
}

interface RecentItem {
  id:          string;
  type:        string;
  currency:    string;
  amount:      number;
  description: string;
  date:        Date;
  userId:      string;
  userEmail:   string;
}

export async function GET(_req: NextRequest) {
  // 1) Only allow signed-in admins
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2) Connect
  await dbConnect();

  // 3) Load all users & transactions
  const rawUsers: any[] = await User.find().lean();
  const rawTxs:   any[] = await Transaction.find().lean();

  // 4) Build summary
  const summary: OverviewSummary = {
    totalBalance: rawUsers.reduce(
      (sum: number, u: any) => sum + (typeof u.balance === 'number' ? u.balance : 0),
      0
    ),
    totalBTC: rawUsers.reduce(
      (sum: number, u: any) => sum + (typeof u.btcBalance === 'number' ? u.btcBalance : 0),
      0
    ),
    totalUsers: rawUsers.length,
    verified: rawUsers.filter((u: any) => u.verified === true).length,
  };

  // 5) Build the users list
  const users: UserListItem[] = rawUsers.map((u: any) => ({
    id:    String(u._id),
    name:  String(u.name),
    email: String(u.email),
    role:  u.role === 'admin' ? 'admin' : 'user',
  }));

  // 6) Build recent transactions, guard missing dates
  const recent: RecentItem[] = rawTxs
    .map((t: any): RecentItem => ({
      id:          String(t._id),
      type:        String(t.type),
      currency:    String(t.currency),
      amount:      typeof t.amount === 'number' ? t.amount : 0,
      description: String(t.description),
      date:        t.date instanceof Date ? t.date : new Date(0),
      userId:      String(t.userId),
      userEmail:   typeof t.userEmail === 'string' ? t.userEmail : '',
    }))
    .filter((item: RecentItem) => !isNaN(item.date.getTime()))
    .sort((a: RecentItem, b: RecentItem) => b.date.getTime() - a.date.getTime())
    .slice(0, 10);

  // 7) Return the payload
  return NextResponse.json({ summary, users, recent });
}
