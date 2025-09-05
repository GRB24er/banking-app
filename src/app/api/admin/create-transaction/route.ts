// CREATE THIS FILE: src/app/api/admin/create-transaction/route.ts
// This is a simpler approach without dynamic routing

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Create transaction request:', body);
    
    // Extract userId from body instead of params
    const { 
      userId,
      type, 
      amount, 
      accountType, 
      description, 
      status = 'completed'
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log(`Processing ${type} for user: ${user.name}`);

    // Determine which balance to update
    const balanceField = accountType === 'savings' 
      ? 'savingsBalance' 
      : accountType === 'investment' 
      ? 'investmentBalance' 
      : 'checkingBalance';

    // Get current balance
    const currentBalance = user[balanceField] || 0;

    // Calculate new balance
    const isCredit = ['deposit', 'transfer-in', 'interest', 'adjustment-credit'].includes(type);
    const balanceChange = isCredit ? Number(amount) : -Number(amount);
    const newBalance = currentBalance + balanceChange;

    console.log(`Current balance: ${currentBalance}, Change: ${balanceChange}, New balance: ${newBalance}`);

    // Check for insufficient funds
    if (!isCredit && newBalance < 0) {
      return NextResponse.json(
        { error: 'Insufficient funds' },
        { status: 400 }
      );
    }

    // Generate reference number
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const prefixMap: { [key: string]: string } = {
      'deposit': 'DEP',
      'withdraw': 'WTH',
      'transfer-in': 'TRI',
      'transfer-out': 'TRO',
      'interest': 'INT',
      'fee': 'FEE',
      'adjustment-credit': 'ADC',
      'adjustment-debit': 'ADD'
    };
    const prefix = prefixMap[type] || 'TRX';
    const reference = `${prefix}-${timestamp}-${random}`;

    // Create the transaction
    const transaction = await Transaction.create({
      userId: user._id,
      type,
      amount: Number(amount),
      description: description || `Admin ${type}`,
      status,
      accountType,
      reference,
      currency: 'USD',
      posted: status === 'completed',
      postedAt: status === 'completed' ? new Date() : null,
      date: new Date(),
      channel: 'admin',
      origin: 'admin_panel'
    });

    console.log('Transaction created:', reference);

    // Update user balance if completed
    if (status === 'completed') {
      user[balanceField] = newBalance;
      await user.save();
      console.log('User balance updated successfully');
    }

    // Return success
    return NextResponse.json({
      success: true,
      message: `Successfully processed ${type} of $${amount} for ${user.name}`,
      transaction: {
        _id: transaction._id.toString(),
        reference: transaction.reference,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        status: transaction.status,
        accountType: transaction.accountType,
        date: transaction.date
      },
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        [balanceField]: newBalance
      },
      previousBalance: currentBalance,
      newBalance: newBalance
    });

  } catch (error: any) {
    console.error('Transaction creation error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process transaction', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}
