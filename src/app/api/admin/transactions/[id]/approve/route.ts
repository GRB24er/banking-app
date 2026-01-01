// src/app/api/admin/transactions/[id]/approve/route.ts
// SINGLE SOURCE OF TRUTH FOR BALANCE UPDATES ON APPROVAL

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Transaction, { isCreditType, getBalanceField } from '@/models/Transaction';
import { sendTransactionEmail } from '@/lib/mail';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id: transactionId } = await params;
    const body = await req.json();
    
    const { 
      action = 'approve',
      adminNotes,
      adminId 
    } = body;
    
    console.log(`[Admin] Processing ${action} for transaction:`, transactionId);
    
    // Find the transaction
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
        { error: `Transaction already ${transaction.status}. Cannot process again.` },
        { status: 400 }
      );
    }
    
    // Double-check posted flag
    if (transaction.posted) {
      return NextResponse.json(
        { error: 'Transaction balance already applied. Cannot process again.' },
        { status: 400 }
      );
    }
    
    // Find the user
    const user = await User.findById(transaction.userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found for this transaction' },
        { status: 404 }
      );
    }
    
    // Get balance field
    const balanceField = getBalanceField(transaction.accountType);
    const currentBalance = Number((user as any)[balanceField] || 0);
    
    if (action === 'approve') {
      // Determine if credit or debit
      const isCredit = isCreditType(transaction.type);
      const balanceChange = isCredit ? transaction.amount : -transaction.amount;
      const newBalance = currentBalance + balanceChange;
      
      console.log(`[Admin] Balance calculation:`, {
        type: transaction.type,
        isCredit,
        amount: transaction.amount,
        currentBalance,
        balanceChange,
        newBalance
      });
      
      // Check funds for debit transactions
      if (!isCredit && newBalance < 0) {
        return NextResponse.json(
          { 
            error: 'Insufficient funds to approve this transaction',
            details: {
              currentBalance,
              required: transaction.amount,
              shortfall: transaction.amount - currentBalance
            }
          },
          { status: 400 }
        );
      }
      
      // =====================================================
      // UPDATE BALANCE - SINGLE PLACE
      // =====================================================
      (user as any)[balanceField] = newBalance;
      await user.save();
      
      console.log(`[Admin] Balance updated: ${currentBalance} -> ${newBalance}`);
      
      // Update transaction status and mark as posted
      transaction.status = 'completed';
      transaction.posted = true;
      transaction.postedAt = new Date();
      transaction.approvedBy = adminId || 'admin';
      transaction.approvedAt = new Date();
      if (adminNotes) transaction.adminNotes = adminNotes;
      
      await transaction.save();
      
      console.log(`[Admin] Transaction marked as completed and posted`);
      
      // Send email notification
      if (user.email) {
        try {
          await sendTransactionEmail(user.email, {
            name: user.name || 'Customer',
            transaction: {
              ...transaction.toObject(),
              balanceBefore: currentBalance,
              balanceAfter: newBalance
            }
          });
          console.log('[Admin] Approval email sent');
        } catch (emailError) {
          console.error('[Admin] Email failed:', emailError);
        }
      }
      
      return NextResponse.json({
        success: true,
        message: 'Transaction approved successfully',
        transaction: {
          _id: transaction._id,
          reference: transaction.reference,
          status: 'completed',
          amount: transaction.amount,
          type: transaction.type,
          accountType: transaction.accountType,
          previousBalance: currentBalance,
          newBalance: newBalance,
          posted: true,
          approvedAt: transaction.approvedAt
        }
      });
      
    } else if (action === 'reject') {
      // =====================================================
      // REJECT - NO BALANCE CHANGES
      // =====================================================
      transaction.status = 'rejected';
      transaction.rejectedBy = adminId || 'admin';
      transaction.rejectedAt = new Date();
      if (adminNotes) transaction.adminNotes = adminNotes;
      // posted stays false - no balance was ever applied
      
      await transaction.save();
      
      console.log(`[Admin] Transaction rejected`);
      
      // Send rejection email
      if (user.email) {
        try {
          await sendTransactionEmail(user.email, {
            name: user.name || 'Customer',
            transaction: transaction.toObject(),
            subject: 'Transaction Rejected'
          });
        } catch (emailError) {
          console.error('[Admin] Rejection email failed:', emailError);
        }
      }
      
      return NextResponse.json({
        success: true,
        message: 'Transaction rejected',
        transaction: {
          _id: transaction._id,
          reference: transaction.reference,
          status: 'rejected',
          amount: transaction.amount,
          type: transaction.type,
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
    console.error('[Admin] Approval/Rejection error:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error.message },
      { status: 500 }
    );
  }
}