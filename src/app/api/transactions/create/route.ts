// src/app/api/transfers/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
// Just use sendTransactionEmail which IS properly exported
import { sendTransactionEmail } from "@/lib/mail";

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

    // Create PENDING transaction
    const transaction = await Transaction.create({
      userId: user._id,
      type: 'transfer-out',
      currency: 'USD',
      amount: parseFloat(amount),
      description: `Transfer to ${recipientName} - ${recipientBank} (${recipientAccount}) - ${description || 'No description'}`,
      status: 'pending',
      accountType,
      posted: false,
      reference: `TRF-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      channel: 'online',
      origin: 'user_transfer',
      date: new Date(),
      metadata: {
        recipientName,
        recipientAccount,
        recipientBank,
        transferType: transferType || 'standard'
      }
    });

    // SEND TRANSACTION EMAIL - using the function that actually exists
    try {
      await sendTransactionEmail(
        user.email,
        {
          name: user.name || user.firstName || 'Customer',
          transaction: transaction
        }
      );
      console.log('[Transfer] Email sent to:', user.email);
    } catch (emailError) {
      console.error('[Transfer] Email failed:', emailError);
    }

    return NextResponse.json({
      success: true,
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
