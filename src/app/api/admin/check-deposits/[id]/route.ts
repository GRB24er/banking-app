import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import CheckDeposit from '@/models/CheckDeposit';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { sendTransactionEmail } from '@/lib/mail';

// GET single deposit
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const deposit = await CheckDeposit.findById(id);
    
    if (!deposit) {
      return NextResponse.json(
        { success: false, error: 'Deposit not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      deposit: {
        id: deposit._id.toString(),
        userId: deposit.userId.toString(),
        userEmail: deposit.userEmail,
        userName: deposit.userName,
        accountType: deposit.accountType,
        amount: deposit.amount,
        checkNumber: deposit.checkNumber,
        frontImage: deposit.frontImage,
        backImage: deposit.backImage,
        status: deposit.status,
        rejectionReason: deposit.rejectionReason,
        notes: deposit.notes,
        createdAt: deposit.createdAt,
        reviewedAt: deposit.reviewedAt,
      },
    });

  } catch (error: any) {
    console.error('[Admin Check Deposit] GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch deposit' },
      { status: 500 }
    );
  }
}

// PATCH - Approve or Reject deposit
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('[Admin Check Deposit] PATCH - Update status');

  try {
    const { id } = await params;
    
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await request.json();
    const { action, rejectionReason, notes } = body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    if (action === 'reject' && !rejectionReason) {
      return NextResponse.json(
        { success: false, error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    const deposit = await CheckDeposit.findById(id);
    
    if (!deposit) {
      return NextResponse.json(
        { success: false, error: 'Deposit not found' },
        { status: 404 }
      );
    }

    if (deposit.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Deposit has already been processed' },
        { status: 400 }
      );
    }

    // Update deposit status
    deposit.status = action === 'approve' ? 'approved' : 'rejected';
    deposit.reviewedAt = new Date();
    deposit.reviewedBy = session.user.id;
    
    if (action === 'reject') {
      deposit.rejectionReason = rejectionReason;
    }
    
    if (notes) {
      deposit.notes = notes;
    }

    await deposit.save();

    // If approved, update user balance
    const user = await User.findById(deposit.userId);

    if (action === 'approve' && user) {
      if (deposit.accountType === 'checking') {
        user.checkingBalance = (user.checkingBalance || 0) + deposit.amount;
      } else if (deposit.accountType === 'savings') {
        user.savingsBalance = (user.savingsBalance || 0) + deposit.amount;
      }

      await user.save();
      console.log(`[Admin Check Deposit] Updated ${deposit.accountType} balance for user ${user.email}: +$${deposit.amount}`);
    }

    // Send email notification
    if (user && user.email) {
      try {
        const reference = `DEP-${deposit._id.toString().slice(-8).toUpperCase()}`;

        // Find or create the transaction record for this deposit
        let transaction = await Transaction.findOne({
          'metadata.depositId': deposit._id.toString(),
        });

        if (transaction) {
          transaction.status = action === 'approve' ? 'completed' : 'rejected';
          transaction.posted = action === 'approve';
          transaction.postedAt = action === 'approve' ? new Date() : null;
          await transaction.save();
        }

        await sendTransactionEmail(user.email, {
          name: user.name || user.firstName || 'Customer',
          transaction: {
            _id: deposit._id,
            userId: deposit.userId,
            reference,
            type: 'deposit',
            currency: 'USD',
            amount: deposit.amount,
            description: action === 'approve'
              ? `Check Deposit Approved - $${deposit.amount.toFixed(2)} credited to ${deposit.accountType}`
              : `Check Deposit Rejected${deposit.rejectionReason ? ': ' + deposit.rejectionReason : ''}`,
            status: action === 'approve' ? 'approved' : 'rejected',
            date: new Date(),
            accountType: deposit.accountType,
            posted: action === 'approve',
            postedAt: action === 'approve' ? new Date() : null,
            createdAt: deposit.createdAt,
            updatedAt: new Date(),
          },
        });
        console.log(`[Admin Check Deposit] Email sent to ${user.email} for ${action}`);
      } catch (emailErr: any) {
        console.error('[Admin Check Deposit] Email failed:', emailErr?.message);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: action === 'approve'
        ? `Deposit approved. $${deposit.amount.toFixed(2)} has been added to the user's ${deposit.accountType} account.`
        : 'Deposit rejected.',
      deposit: {
        id: deposit._id.toString(),
        status: deposit.status,
        reviewedAt: deposit.reviewedAt,
      },
    });

  } catch (error: any) {
    console.error('[Admin Check Deposit] PATCH Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update deposit' },
      { status: 500 }
    );
  }
}
