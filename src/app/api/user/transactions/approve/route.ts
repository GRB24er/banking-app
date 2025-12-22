import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { sendTransactionEmail } from '@/lib/mail';
import { generateCreditEmail, generateDebitEmail } from '@/lib/bankingEmailTemplates';

// NO PARAMS - this is NOT a dynamic route
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    const body = await req.json();
    const { 
      transactionId, // Get ID from body instead of URL params
      action, // 'approve' or 'reject'
      adminNotes,
      adminId 
    } = body;
    
    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }
    
    // Validate action
    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }
    
    // Find the transaction
    const transaction = await Transaction.findById(transactionId);
    
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }
    
    // Check if transaction is already processed
    if (transaction.status !== 'pending') {
      return NextResponse.json(
        { error: `Transaction already ${transaction.status}` },
        { status: 400 }
      );
    }
    
    // Find the user
    const user = await User.findById(transaction.userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Determine the balance field based on account type
    const balanceField = transaction.accountType === 'savings' 
      ? 'savingsBalance' 
      : transaction.accountType === 'investment' 
      ? 'investmentBalance' 
      : 'checkingBalance';
    
    if (action === 'approve') {
      // Process approval
      const isCredit = ['deposit', 'transfer-in', 'interest', 'adjustment-credit'].includes(transaction.type);
      const balanceChange = isCredit ? transaction.amount : -transaction.amount;
      const currentBalance = user[balanceField] || 0;
      const newBalance = currentBalance + balanceChange;
      
      // Check for insufficient funds on debit transactions
      if (!isCredit && newBalance < 0) {
        return NextResponse.json(
          { error: 'Insufficient funds to approve this transaction' },
          { status: 400 }
        );
      }
      
      // Update user balance
      user[balanceField] = newBalance;
      await user.save();
      
      // Update transaction status
      transaction.status = 'completed';
      transaction.posted = true;
      transaction.postedAt = new Date();
      transaction.approvedBy = adminId;
      transaction.approvedAt = new Date();
      transaction.adminNotes = adminNotes;
      
      await transaction.save();
      
      // Send email notification
      try {
        if (user.email) {
          const emailData = {
            recipientName: user.name,
            recipientEmail: user.email,
            amount: transaction.amount,
            currency: transaction.currency || 'USD',
            transactionId: transaction._id.toString(),
            transactionReference: transaction.reference || transaction._id.toString(),
            transactionType: transaction.type,
            accountType: transaction.accountType,
            date: new Date(),
            balance: newBalance,
            balanceBefore: currentBalance,
            balanceAfter: newBalance,
            description: transaction.description,
            status: 'completed' as const
          };
          
          let emailHtml = '';
          if (isCredit) {
            emailHtml = generateCreditEmail(emailData);
          } else {
            emailHtml = generateDebitEmail(emailData);
          }
          
          await sendTransactionEmail(user.email, {
            name: user.name,
            transaction: transaction
          });
        }
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
        // Continue even if email fails
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
      
    } else {
      // Process rejection
      transaction.status = 'rejected';
      transaction.rejectedBy = adminId;
      transaction.rejectedAt = new Date();
      transaction.adminNotes = adminNotes;
      
      await transaction.save();
      
      // Send rejection notification
      if (user.email) {
        try {
          await sendTransactionEmail(user.email, {
            name: user.name,
            transaction: transaction,
            type: 'rejection'
          });
        } catch (emailError) {
          console.error('Failed to send rejection email:', emailError);
        }
      }
      
      return NextResponse.json({
        success: true,
        message: 'Transaction rejected',
        transaction: {
          _id: transaction._id,
          status: 'rejected',
          rejectedAt: transaction.rejectedAt
        }
      });
    }
    
  } catch (error) {
    console.error('Transaction approval error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to process transaction',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// GET endpoint - get transaction ID from query params
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const transactionId = searchParams.get('id');
    
    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }
    
    const transaction = await Transaction.findById(transactionId)
      .populate('userId', 'name email accountNumber');
    
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      transaction: transaction
    });
    
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction details' },
      { status: 500 }
    );
  }
}