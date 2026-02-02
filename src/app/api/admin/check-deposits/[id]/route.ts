import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import CheckDeposit from '@/models/CheckDeposit';
import User from '@/models/User';

// GET single deposit
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const deposit = await CheckDeposit.findById(params.id);
    
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
  { params }: { params: { id: string } }
) {
  console.log('[Admin Check Deposit] PATCH - Update status');

  try {
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

    const deposit = await CheckDeposit.findById(params.id);
    
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
    if (action === 'approve') {
      const user = await User.findById(deposit.userId);
      
      if (user) {
        if (deposit.accountType === 'checking') {
          user.checkingBalance = (user.checkingBalance || 0) + deposit.amount;
        } else if (deposit.accountType === 'savings') {
          user.savingsBalance = (user.savingsBalance || 0) + deposit.amount;
        }
        
        await user.save();
        console.log(`[Admin Check Deposit] Updated ${deposit.accountType} balance for user ${user.email}: +$${deposit.amount}`);
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
