// src/app/api/admin/create-transaction/route.ts
// ADMIN CREATE TRANSACTION - Can create PENDING or COMPLETED

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { sendTransactionEmail } from '@/lib/mail';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const { 
      userId,
      type, 
      amount, 
      accountType = 'checking', 
      description, 
      status = 'pending', // Admin can choose: 'pending' or 'completed'
      currency = 'USD'
    } = body;

    console.log('[Admin Create] 📝 Request:', { 
      userId, 
      type, 
      amount, 
      accountType, 
      status 
    });

    // Validation
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!type || !amount) {
      return NextResponse.json(
        { error: 'Type and amount are required' },
        { status: 400 }
      );
    }

    // Validate transaction type
    const validTypes = [
      'deposit',
      'withdraw',
      'transfer-in',
      'transfer-out',
      'fee',
      'interest',
      'adjustment-credit',
      'adjustment-debit'
    ];

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid transaction type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate status
    if (!['pending', 'completed', 'approved'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be pending, completed, or approved' },
        { status: 400 }
      );
    }

    await connectDB();
    
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // ALWAYS POSITIVE AMOUNT
    const transactionAmount = Math.abs(Number(amount));
    
    if (isNaN(transactionAmount) || transactionAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    const balanceField = accountType === 'savings' 
      ? 'savingsBalance' 
      : accountType === 'investment' 
      ? 'investmentBalance' 
      : 'checkingBalance';

    const currentBalance = (user as any)[balanceField] || 0;

    const reference = `ADM-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Determine final status
    // If admin chooses 'completed' or 'approved', the middleware will update balances
    const finalStatus = status === 'completed' ? 'approved' : status;

    // Create transaction
    const transaction = await Transaction.create({
      userId: user._id,
      type,
      amount: transactionAmount, // POSITIVE
      description: description || `Admin ${type}`,
      status: finalStatus,
      accountType,
      reference,
      currency,
      posted: false, // Middleware will set to true if approved
      postedAt: null,
      date: new Date(),
      channel: 'admin',
      origin: 'admin_panel'
    });

    console.log('[Admin Create] 💾 Transaction created:', transaction._id);

    // Get potentially updated balance (if status was approved/completed)
    const updatedUser = await User.findById(user._id);
    const newBalance = (updatedUser as any)[balanceField] || currentBalance;

    const balanceChanged = newBalance !== currentBalance;

    console.log('[Admin Create] 💰 Balance:', {
      previous: currentBalance,
      new: newBalance,
      changed: balanceChanged
    });

    // ✅ SEND EMAIL
    try {
      await sendTransactionEmail(user.email, {
        name: user.name || 'Customer',
        transaction
      });
      console.log('[Admin Create] ✅ Email sent to:', user.email);
    } catch (emailError) {
      console.error('[Admin Create] ❌ Email failed:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully ${finalStatus === 'approved' ? 'processed' : 'created'} ${type} transaction`,
      transaction: {
        _id: transaction._id,
        reference: transaction.reference,
        type: transaction.type,
        amount: transaction.amount,
        status: transaction.status,
        accountType: transaction.accountType,
        posted: transaction.posted
      },
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        [balanceField]: newBalance
      },
      balanceChange: balanceChanged ? {
        previous: currentBalance,
        new: newBalance,
        change: newBalance - currentBalance
      } : null
    });

  } catch (error: any) {
    console.error('[Admin Create] ❌ Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process transaction',
        details: error.message
      },
      { status: 500 }
    );
  }
}