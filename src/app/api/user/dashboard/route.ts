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

// Define the transaction type
interface TransactionData {
  reference: string;
  type: string;
  currency: string;
  amount: number;
  date: Date | string;
  description: string;
  status: string;
  rawStatus: string;
  accountType: string;
  isReal: boolean;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    await connectDB();
    
    // Get the ACTUAL user's data including all balances and name
    const user = await User.findOne({ email: session.user.email })
      .select("_id checkingBalance savingsBalance investmentBalance name email")
      .lean();
    
    if (!user?._id) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Get REAL transactions from database for THIS specific user
    const realTransactions = await Transaction.find({ userId: user._id })
      .sort({ date: -1, createdAt: -1 })
      .limit(50)
      .select("_id reference type currency amount date description status accountType createdAt")
      .lean();
    
    // Convert real transactions to the format we need
    const realTxFormatted: TransactionData[] = realTransactions.map((t: any) => ({
      reference: t.reference ?? String(t._id),
      type: t.type ?? "deposit",
      currency: t.currency ?? "USD",
      amount: typeof t.amount === "number" ? t.amount : Number(t.amount) || 0,
      date: t.date ?? t.createdAt ?? new Date(),
      description: t.description ?? "Transaction",
      status: displayStatus(t.status),
      rawStatus: t.status,
      accountType: t.accountType ?? "checking",
      isReal: true
    }));
    
    // Sort by date (newest first) - FIX THE TYPESCRIPT ERROR
    realTxFormatted.sort((a: TransactionData, b: TransactionData) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    
    // Take the most recent 20 transactions
    const recent = realTxFormatted.slice(0, 20);
    
    // Return the ACTUAL user's balances from database
    const balances = {
      checking: user.checkingBalance || 0,
      savings: user.savingsBalance || 0,
      investment: user.investmentBalance || 0
    };
    
    // Return the ACTUAL user's name from database
    return NextResponse.json({ 
      balances, 
      recent,
      user: {
        name: user.name || session.user.name || "User",
        email: user.email
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