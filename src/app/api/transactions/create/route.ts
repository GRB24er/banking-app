// src/app/api/transfers/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import { sendSimpleEmail } from "@/lib/mail";
import { 
  generateTransactionStatusEmail,
  type BankingEmailData 
} from "@/lib/bankingEmailTemplates";

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
      reference: `TRF-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      channel: 'online',
      origin: 'user_transfer',
      date: new Date(),
      // Store recipient details in metadata for admin review
      metadata: {
        recipientName,
        recipientAccount,
        recipientBank,
        transferType: transferType || 'standard'
      }
    });

    // SEND EMAIL NOTIFICATION FOR PENDING TRANSFER
    console.log('[Transfer] Sending pending transfer notification to:', user.email);
    
    try {
      // Prepare email data
      const emailData: BankingEmailData = {
        recipientName: user.name || user.firstName || 'Valued Customer',
        recipientEmail: user.email,
        transactionReference: transaction.reference,
        transactionType: 'transfer',
        amount: parseFloat(amount),
        currency: 'USD',
        description: `Transfer to ${recipientName} at ${recipientBank}`,
        date: new Date(),
        accountType: accountType as any,
        balanceBefore: currentBalance,
        balanceAfter: currentBalance, // Balance unchanged until approved
        status: 'pending',
        customMessage: `Your transfer to ${recipientName} is pending approval. We'll notify you once it's processed.`
      };

      // Generate pending status email
      const html = generateTransactionStatusEmail(emailData, 'pending');
      
      const subject = `Transfer Pending: $${parseFloat(amount).toFixed(2)} to ${recipientName}`;

      const emailResult = await sendSimpleEmail(
        user.email,
        subject,
        `Your transfer of $${parseFloat(amount).toFixed(2)} to ${recipientName} is pending approval.`,
        html
      );

      console.log('[Transfer] Pending notification email sent:', {
        to: user.email,
        messageId: emailResult.messageId,
        success: !emailResult.failed
      });

      // Also send notification to admin (optional)
      if (process.env.ADMIN_EMAIL) {
        await sendSimpleEmail(
          process.env.ADMIN_EMAIL,
          `New Transfer Pending Approval: ${transaction.reference}`,
          `User ${user.email} has initiated a transfer:\n
          Amount: $${parseFloat(amount).toFixed(2)}\n
          To: ${recipientName} at ${recipientBank}\n
          Account: ${recipientAccount}\n
          Reference: ${transaction.reference}\n
          \nPlease review in the admin panel.`
        );
      }

    } catch (emailError) {
      console.error('[Transfer] Email notification failed:', emailError);
      // Don't fail the transfer if email fails
    }

    return NextResponse.json({
      success: true,
      message: "Transfer initiated and pending approval. You will receive an email confirmation.",
      transaction: {
        id: transaction._id,
        reference: transaction.reference,
        status: transaction.status,
        amount: transaction.amount
      },
      emailSent: true
    });

  } catch (error) {
    console.error('Transfer creation error:', error);
    return NextResponse.json(
      { error: "Failed to create transfer" },
      { status: 500 }
    );
  }
}
