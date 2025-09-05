// src/app/api/admin/transactions/[id]/approve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { sendTransactionEmail } from '@/lib/mail';
import { generateCreditEmail, generateDebitEmail } from '@/lib/bankingEmailTemplates';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    // Get the transaction ID from params
    const { id: transactionId } = await params;
    const body = await req.json();
    
    const { 
      action = 'approve', // Default to 'approve' if not specified
      adminNotes,
      adminId 
    } = body;
    
    // Find the transaction to approve/reject
    const transaction = await Transaction.findById(transactionId);
    
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }
    
    // Check if already processed
    if (transaction.status !== 'pending') {
      return NextResponse.json(
        { error: `Transaction already ${transaction.status}` },
        { status: 400 }
      );
    }
    
    // Find the user for this transaction
    const user = await User.findById(transaction.userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found for this transaction' },
        { status: 404 }
      );
    }
    
    // Determine balance field
    const balanceField = transaction.accountType === 'savings' 
      ? 'savingsBalance' 
      : transaction.accountType === 'investment' 
      ? 'investmentBalance' 
      : 'checkingBalance';
    
    if (action === 'approve') {
      // Check transaction type
      const isCredit = ['deposit', 'transfer-in', 'interest', 'adjustment-credit'].includes(transaction.type);
      const balanceChange = isCredit ? transaction.amount : -transaction.amount;
      const currentBalance = user[balanceField] || 0;
      const newBalance = currentBalance + balanceChange;
      
      // Check funds for debit
      if (!isCredit && newBalance < 0) {
        return NextResponse.json(
          { error: 'Insufficient funds to approve this transaction' },
          { status: 400 }
        );
      }
      
      // Update user balance
      user[balanceField] = newBalance;
      await user.save();
      
      // Update transaction
      transaction.status = 'completed';
      transaction.posted = true;
      transaction.postedAt = new Date();
      transaction.approvedBy = adminId;
      transaction.approvedAt = new Date();
      transaction.adminNotes = adminNotes;
      await transaction.save();
      
      // Send email
      if (user.email) {
        try {
          const emailData = {
            recipientName: user.name,
            recipientEmail: user.email,
            amount: transaction.amount,
            currency: transaction.currency || 'USD',
            transactionReference: transaction.reference || transaction._id.toString(),
            transactionType: transaction.type,
            transactionId: transaction._id.toString(),
            date: new Date(),
            accountType: transaction.accountType,
            balanceBefore: currentBalance,
            balanceAfter: newBalance,
            balance: newBalance,
            description: transaction.description,
            status: 'completed' as any
          };
          
          const emailHtml = isCredit 
            ? generateCreditEmail(emailData as any)
            : generateDebitEmail(emailData as any);
          
          await sendTransactionEmail(user.email, {
            name: user.name,
            transaction: transaction
          });
        } catch (emailError) {
          console.error('Email failed:', emailError);
        }
      }
      
      return NextResponse.json({
        success: true,
        message: 'Transaction approved successfully',
        transaction: {
          _id: transaction._id,
          status: 'completed',
          amount: transaction.amount,
          type: transaction.type,
          newBalance: newBalance,
          approvedAt: transaction.approvedAt
        }
      });
      
    } else if (action === 'reject') {
      // Reject the transaction
      transaction.status = 'rejected';
      transaction.rejectedBy = adminId;
      transaction.rejectedAt = new Date();
      transaction.adminNotes = adminNotes;
      await transaction.save();
      
      return NextResponse.json({
        success: true,
        message: 'Transaction rejected',
        transaction: {
          _id: transaction._id,
          status: 'rejected',
          rejectedAt: transaction.rejectedAt
        }
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "approve" or "reject"' },
        { status: 400 }
      );
    }
    
  } catch (error: any) {
    console.error('Approval error:', error);
    return NextResponse.json(
      { error: 'Failed to process approval', details: error.message },
      { status: 500 }
    );
  }
}