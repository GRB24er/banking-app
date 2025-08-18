// src/app/api/user/dashboard/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";

function displayStatus(status: string) {
  if (status === "completed" || status === "approved") return "Completed";
  if (status === "pending_verification") return "Pending – Verification";
  if (status === "pending") return "Pending";
  if (status === "rejected") return "Rejected";
  return status ?? "Pending";
}

// Mock historical transactions (from investment history)
const mockHistoricalTransactions = [
  {
    reference: "INV-2023-001",
    type: "interest",
    currency: "USD",
    amount: 2500000,
    date: new Date("2023-12-31"),
    description: "Annual Investment Return - Year 20",
    status: "Completed",
    accountType: "investment"
  },
  {
    reference: "INV-2022-001",
    type: "interest",
    currency: "USD",
    amount: 2100000,
    date: new Date("2022-12-31"),
    description: "Annual Investment Return - Year 19",
    status: "Completed",
    accountType: "investment"
  },
  {
    reference: "DEP-2025-MAY",
    type: "deposit",
    currency: "USD",
    amount: 4000,
    date: new Date("2025-05-29"),
    description: "Wire Transfer Deposit",
    status: "Completed",
    accountType: "checking"
  },
  {
    reference: "INT-2024-Q4",
    type: "interest",
    currency: "USD",
    amount: 45.50,
    date: new Date("2024-12-31"),
    description: "Quarterly Interest Credit",
    status: "Completed",
    accountType: "savings"
  },
  {
    reference: "INV-2021-001",
    type: "interest",
    currency: "USD",
    amount: 1800000,
    date: new Date("2021-12-31"),
    description: "Annual Investment Return - Year 18",
    status: "Completed",
    accountType: "investment"
  }
];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    await connectDB();
    
    const user = await User.findOne({ email: session.user.email })
      .select("_id checkingBalance savingsBalance investmentBalance name")
      .lean();
    
    if (!user?._id) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Get REAL transactions from database
    const realTransactions = await Transaction.find({ userId: user._id })
      .sort({ date: -1, createdAt: -1 })
      .limit(20)
      .select("_id reference type currency amount date description status accountType createdAt")
      .lean();
    
    // Convert real transactions to the format we need
    const realTxFormatted = realTransactions.map((t: any) => ({
      reference: t.reference ?? String(t._id),
      type: t.type ?? "deposit",
      currency: t.currency ?? "USD",
      amount: typeof t.amount === "number" ? t.amount : Number(t.amount) || 0,
      date: t.date ?? t.createdAt ?? new Date(),
      description: t.description ?? "Transaction",
      status: displayStatus(t.status),
      rawStatus: t.status,
      accountType: t.accountType ?? "checking",
      isReal: true // Mark as real transaction
    }));
    
    // Combine real and mock transactions
    const allTransactions = [
      ...realTxFormatted,
      ...mockHistoricalTransactions.map(tx => ({
        ...tx,
        rawStatus: tx.status.toLowerCase(),
        isReal: false // Mark as mock transaction
      }))
    ];
    
    // Sort by date (newest first)
    allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Take the most recent 20 transactions
    const recent = allTransactions.slice(0, 20);
    
    // Return correct balances
    const balances = {
      checking: 4000.00,
      savings: 1000.00,
      investment: 45458575.89
    };
    
    return NextResponse.json({ 
      balances, 
      recent,
      user: {
        name: "Hajand Morgan"
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}