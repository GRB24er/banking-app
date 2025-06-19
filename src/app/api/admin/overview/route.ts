// File: src/app/api/admin/overview/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { db } from '@/lib/mongodb';
import type { BaseUserType, UserType } from '@/types/user'; // BaseUserType.transactions shape :contentReference[oaicite:0]{index=0}

/** Totals to show in the admin dashboard */
interface OverviewSummary {
  totalBalance: number;
  totalBTC: number;
  totalUsers: number;
  verified: number;
}

/** Exact type of each embedded transaction on a BaseUserType */
type UserTransaction = NonNullable<BaseUserType['transactions']>[number];

/** A RecentItem is one UserTransaction plus the owner's name/email */
export interface RecentItem extends UserTransaction {
  user: string;
  email: string;
}

export async function GET(request: NextRequest) {
  // 1) Auth check
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    // 2) Fetch all users (typed as UserType[])
    const users = (await db.getUsers()) as UserType[];

    // 3) Compute summary totals
    const summary = users.reduce<OverviewSummary>(
      (acc, user) => {
        acc.totalBalance += user.balance;
        acc.totalBTC     += user.btcBalance;
        acc.totalUsers   += 1;
        if (user.verified) acc.verified += 1;
        return acc;
      },
      { totalBalance: 0, totalBTC: 0, totalUsers: 0, verified: 0 }
    );

    // 4) Build a list of each user’s most recent transaction
    const recent: RecentItem[] = users
      .flatMap((u) =>
        // Use ?? to guard against undefined
        (u.transactions ?? [])
          .slice(-1)
          .map((t: UserTransaction) => ({
            ...t,
            user:  u.name,
            email: u.email,
          }))
      )
      // Now TS knows .date exists on RecentItem
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 10);

    // 5) Return everything
    return NextResponse.json({ users, summary, recent });
  } catch (err: any) {
    console.error('Admin overview error:', err);
    return NextResponse.json(
      { error: 'Failed to load admin overview' },
      { status: 500 }
    );
  }
}
