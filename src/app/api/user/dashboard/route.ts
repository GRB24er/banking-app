// src/app/api/user/dashboard/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";

// Define TypeScript interfaces
interface Transaction {
  _id: string;
  reference: string;
  type: string;
  currency: string;
  amount: number;
  date: Date;
  description: string;
  status: string;
  accountType: string;
  createdAt: Date;
  userId: string;
}

interface UserData {
  _id: string;
  checkingBalance: number;
  savingsBalance: number;
  investmentBalance: number;
  name: string;
  email: string;
}

interface FormattedTransaction {
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

interface DashboardResponse {
  balances: {
    checking: number;
    savings: number;
    investment: number;
  };
  recent: FormattedTransaction[];
  user: {
    name: string;
    email: string;
  };
  error?: string;
}

function displayStatus(status: string): string {
  const statusMap: Record<string, string> = {
    completed: "Completed",
    approved: "Completed",
    pending_verification: "Pending – Verification",
    pending: "Pending",
    rejected: "Rejected"
  };
  
  return statusMap[status] || status || "Pending";
}

export async function GET(): Promise<NextResponse<DashboardResponse>> {
  try {
    console.log('🔍 Dashboard API: Starting request...');
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.log('❌ No session found');
      return NextResponse.json({ 
        error: "Unauthorized",
        balances: { checking: 0, savings: 0, investment: 0 },
        recent: [],
        user: { name: "", email: "" }
      }, { status: 401 });
    }
    
    console.log('🔌 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected');
    
    // Get user data with timeout
    const user = await User.findOne({ email: session.user.email })
      .select("_id checkingBalance savingsBalance investmentBalance name email")
      .lean()
      .maxTimeMS(5000) as UserData | null;
    
    if (!user) {
      console.log('❌ User not found in database');
      return NextResponse.json({ 
        error: "User not found",
        balances: { checking: 0, savings: 0, investment: 0 },
        recent: [],
        user: { name: "", email: "" }
      }, { status: 404 });
    }
    
    // Get transactions with error handling
    let realTransactions: Transaction[] = [];
    try {
      realTransactions = await Transaction.find({ userId: user._id })
        .sort({ date: -1, createdAt: -1 })
        .limit(20) // Reduced from 50 to 20 for performance
        .select("reference type currency amount date description status accountType createdAt")
        .lean()
        .maxTimeMS(10000) as Transaction[];
      
      console.log('📊 Transactions found:', realTransactions.length);
    } catch (txError) {
      console.error('⚠️ Transaction query error:', txError);
      realTransactions = [];
    }
    
    // Format transactions
    const formattedTransactions: FormattedTransaction[] = realTransactions.map(t => ({
      reference: t.reference || t._id.toString(),
      type: t.type || "deposit",
      currency: t.currency || "USD",
      amount: Math.abs(t.amount) || 0,
      date: t.date || t.createdAt,
      description: t.description || "Transaction",
      status: displayStatus(t.status),
      rawStatus: t.status || "pending",
      accountType: t.accountType || "checking",
      isReal: true
    }));
    
    // Prepare response
    const response: DashboardResponse = {
      balances: {
        checking: user.checkingBalance || 0,
        savings: user.savingsBalance || 0,
        investment: user.investmentBalance || 0
      },
      recent: formattedTransactions,
      user: {
        name: user.name || session.user.name || "User",
        email: user.email
      }
    };
    
    console.log('✅ Dashboard API: Sending response');
    return NextResponse.json(response, { status: 200 });
    
  } catch (error) {
    console.error("❌ Dashboard API error:", error);
    
    return NextResponse.json({
      balances: { checking: 0, savings: 0, investment: 0 },
      recent: [],
      user: { name: "User", email: "unknown" },
      error: "Partial data loaded due to server error"
    }, { status: 200 });
  }
}