// src/app/api/admin/transactions/[id]/approve/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import User from "@/models/User";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || session.user.email !== "admin@horizonbank.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await the params
    const { id: transactionId } = await context.params;

    await connectDB();

    const transaction = await Transaction.findById(transactionId);
    
    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    if (transaction.status !== "pending") {
      return NextResponse.json({ error: "Transaction already processed" }, { status: 400 });
    }

    // Get user
    const user = await User.findById(transaction.userId);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Deduct from appropriate account
    const accountType = transaction.accountType || "checking";
    const amount = transaction.amount;

    if (accountType === "checking") {
      if (user.checkingBalance < amount) {
        return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });
      }
      user.checkingBalance -= amount;
    } else if (accountType === "savings") {
      if (user.savingsBalance < amount) {
        return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });
      }
      user.savingsBalance -= amount;
    } else if (accountType === "investment") {
      if (user.investmentBalance < amount) {
        return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });
      }
      user.investmentBalance -= amount;
    }

    // Save user with new balance
    await user.save();

    // Update transaction status
    transaction.status = "completed";
    transaction.posted = true;
    transaction.postedAt = new Date();
    await transaction.save();

    return NextResponse.json({
      success: true,
      message: "Transaction approved successfully",
      transaction
    });

  } catch (error) {
    console.error("Error approving transaction:", error);
    return NextResponse.json(
      { error: "Failed to approve transaction" },
      { status: 500 }
    );
  }
}