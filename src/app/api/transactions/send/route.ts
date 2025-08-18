// src/app/api/transactions/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      recipientName,
      recipientAccount,
      recipientBank,
      amount,
      accountType,
      description,
      transferType
    } = body;

    // Validate amount
    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check balance
    const balance = accountType === "checking" ? user.checkingBalance :
                   accountType === "savings" ? user.savingsBalance :
                   user.investmentBalance;

    if (balance < transferAmount) {
      return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });
    }

    // Create PENDING transaction (requires admin approval)
    const transaction = await Transaction.create({
      userId: user._id,
      type: "withdraw",
      currency: "USD",
      amount: transferAmount,
      description: `Transfer to ${recipientName} - ${recipientBank} (${recipientAccount}) ${description ? ': ' + description : ''}`,
      status: "pending", // PENDING - requires approval
      date: new Date(),
      accountType: accountType,
      posted: false, // NOT posted until approved
      reference: `TRF-${Date.now()}`,
      category: "Transfer",
      channel: "online",
      origin: "web_banking"
    });

    return NextResponse.json({
      success: true,
      message: "Transaction initiated. Pending admin approval.",
      transaction: {
        id: transaction._id,
        reference: transaction.reference,
        amount: transferAmount,
        status: "pending"
      }
    });

  } catch (error) {
    console.error("Send money error:", error);
    return NextResponse.json(
      { error: "Transaction failed" },
      { status: 500 }
    );
  }
}
