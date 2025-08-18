// src/app/api/admin/transactions/[id]/reject/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";

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

    // Update transaction status to rejected
    transaction.status = "rejected";
    await transaction.save();

    return NextResponse.json({
      success: true,
      message: "Transaction rejected successfully",
      transaction
    });

  } catch (error) {
    console.error("Error rejecting transaction:", error);
    return NextResponse.json(
      { error: "Failed to reject transaction" },
      { status: 500 }
    );
  }
}