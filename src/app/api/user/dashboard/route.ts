// src/app/api/user/dashboard/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";

function displayStatus(status: string) {
  // Map DB statuses to human/banking labels
  if (status === "completed" || status === "approved") return "Completed";
  if (status === "pending_verification") return "Pending – Verification";
  if (status === "pending") return "Pending";
  if (status === "rejected") return "Rejected";
  return status ?? "Pending";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const user = await User.findOne({ email: session.user.email })
    .select("_id checkingBalance savingsBalance investmentBalance")
    .lean();

  if (!user?._id) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const balances = {
    checking:   (user as any).checkingBalance   ?? 0,
    savings:    (user as any).savingsBalance    ?? 0,
    investment: (user as any).investmentBalance ?? 0,
  };

  const txDocs = await Transaction.find({ userId: user._id })
    .sort({ date: -1, createdAt: -1 })
    .limit(10)
    .select("_id reference type currency amount date description status accountType createdAt")
    .lean();

  const recent = txDocs.map((t: any) => ({
    reference: t.reference ?? String(t._id),
    type: t.type ?? "deposit",
    currency: t.currency ?? "USD",
    amount: typeof t.amount === "number" ? t.amount : Number(t.amount) || 0,
    date: t.date ?? t.createdAt ?? new Date(),
    description: t.description === "Admin deposit" ? "Bank credit" : (t.description ?? "Bank credit"),
    status: displayStatus(t.status),
    rawStatus: t.status, // keep raw for UI chips if needed
    accountType: t.accountType ?? "checking",
  }));

  return NextResponse.json({ balances, recent }, { status: 200 });
}
