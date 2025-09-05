// src/app/api/transfers/create/route.ts (NEW)
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      recipientName, 
      recipientAccount, 
      recipientBank,
      amount, 
      accountType, 
      description,
      transferType 
    } = body;

    await connectDB();

    // Get user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check balance
    const balanceField = 
      accountType === 'savings' ? 'savingsBalance' :
      accountType === 'investment' ? 'investmentBalance' :
      'checkingBalance';
    
    const currentBalance = user[balanceField] || 0;
    
    if (parseFloat(amount) > currentBalance) {
      return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });
    }

    // Create PENDING transaction (not posted to balance yet)
    const transaction = await Transaction.create({
      userId: user._id,
      type: 'transfer-out',
      currency: 'USD',
      amount: parseFloat(amount),
      description: `Transfer to ${recipientName} - ${recipientBank} (${recipientAccount}) - ${description || 'No description'}`,
      status: 'pending', // REQUIRES ADMIN APPROVAL
      accountType,
      posted: false, // NOT POSTED YET
      reference: `TRF-${Date.now()}`,
      channel: 'online',
      origin: 'user_transfer',
      // Store recipient details in description or metadata
    });

    return NextResponse.json({
      message: "Transfer initiated and pending approval",
      transaction: {
        id: transaction._id,
        reference: transaction.reference,
        status: transaction.status,
        amount: transaction.amount
      }
    });

  } catch (error) {
    console.error('Transfer creation error:', error);
    return NextResponse.json(
      { error: "Failed to create transfer" },
      { status: 500 }
    );
  }
}