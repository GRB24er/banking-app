// File: src/app/api/user/dashboard/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import type { ITransaction } from "@/types/transaction";

export async function GET(request: Request) {
  // 1) Authenticate
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2) Connect to DB and load user + embedded transactions
  await connectDB();
  const user = await User.findOne({ email: session.user.email })
    .select("balance savingsBalance investmentBalance transactions")
    .lean();
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // 3) Prepare balances object
  const balances = {
    checking:   user.balance,
    savings:    (user as any).savingsBalance    ?? 0,
    investment: (user as any).investmentBalance ?? 0,
  };

  // 4) Sort & take the latest 10 transactions
  const recent: ITransaction[] = (user.transactions || [])
    .sort((a: ITransaction, b: ITransaction) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    .slice(0, 10);

  // 5) Return raw data—statuses and amounts come straight from DB
  return NextResponse.json({ balances, recent });
}
