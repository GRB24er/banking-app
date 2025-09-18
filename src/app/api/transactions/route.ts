// src/app/api/transactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import { sendTransactionEmail } from "@/lib/mail";
import { 
  generateCreditEmail, 
  generateDebitEmail, 
  generateTransactionStatusEmail,
  type BankingEmailData 
} from "@/lib/bankingEmailTemplates";

// Define types for better TypeScript support
interface FormattedTransaction {
  _id: string;
  type: string;
  amount: number;
  adjustedAmount: number;
  description: string;
  date: Date;
  status: string;
  accountType: string;
  reference: string;
  channel: string;
  origin: string;
  posted: boolean;
  postedAt: Date | null;
  balanceAfter: number;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Helper function to send transaction email with enhanced templates
async function sendEnhancedTransactionNotification(
  user: any,
  transaction: any,
  balanceBefore: number,
  balanceAfter: number
) {
  try {
    console.log('[Email] Preparing to send transaction email to:', user.email);
    
    // Just use sendTransactionEmail - it already exists and works
    const emailResult = await sendTransactionEmail(
      user.email,
      {
        name: user.name || user.firstName || 'Customer',
        transaction: {
          _id: transaction._id,
          userId: transaction.userId,
          reference: transaction.reference || transaction._id.toString(),
          type: transaction.type,
          currency: transaction.currency || 'USD',
          amount: transaction.amount,
          description: transaction.description || 'Bank Transaction',
          status: transaction.status || 'completed',
          date: transaction.date || transaction.createdAt || new Date(),
          accountType: transaction.accountType || 'checking',
          posted: transaction.posted !== undefined ? transaction.posted : true,
          postedAt: transaction.postedAt || new Date(),
          createdAt: transaction.createdAt || new Date(),
          updatedAt: transaction.updatedAt || new Date(),
          channel: transaction.channel,
          origin: transaction.origin,
          editedDateByAdmin: transaction.editedDateByAdmin || false
        }
      }
    );

    console.log('[Email] Transaction email sent:', {
      to: user.email,
      messageId: emailResult.messageId,
      success: !emailResult.failed && !emailResult.skipped
    });

    return emailResult;
  } catch (error) {
    console.error('[Email] Failed to send transaction notification:', error);
    // Don't throw - we don't want to fail the transaction if email fails
    return { failed: true, error: error };
  }
}

// GET - Fetch transactions (unchanged)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const accountType = searchParams.get('accountType');
    const transactionType = searchParams.get('type');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query
    const query: any = { userId: user._id };
    
    if (accountType && accountType !== 'all') {
      query.accountType = accountType;
    }
    
    if (transactionType && transactionType !== 'all') {
      query.type = transactionType;
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Fetch transactions
    const transactions = await Transaction.find(query)
      .sort({ date: -1, createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean();

    // Calculate balance after each transaction
    let runningBalance = {
      checking: user.checkingBalance || 0,
      savings: user.savingsBalance || 0,
      investment: user.investmentBalance || 0
    };

    // Format transactions with proper amounts and balance tracking
    const formattedTransactions: FormattedTransaction[] = transactions.map((tx: any) => {
      const accountType = tx.accountType as keyof typeof runningBalance;
      
      // Determine if this is a debit or credit
      const isDebit = [
        'transfer-out',
        'withdrawal',
        'payment',
        'fee',
        'charge',
        'purchase'
      ].includes(tx.type) || 
      (tx.origin && ['external_transfer', 'wire_transfer', 'international_transfer'].includes(tx.origin) && !tx.type.includes('in'));
      
      // For internal transfers, check the reference
      let adjustedAmount = tx.amount;
      if (tx.origin === 'internal_transfer') {
        if (tx.reference?.includes('-OUT')) {
          adjustedAmount = -Math.abs(tx.amount);
        } else if (tx.reference?.includes('-IN')) {
          adjustedAmount = Math.abs(tx.amount);
        }
      } else if (isDebit) {
        adjustedAmount = -Math.abs(tx.amount);
      } else {
        adjustedAmount = Math.abs(tx.amount);
      }
      
      // Track balance if available
      let balanceAfter = tx.balanceAfter;
      if (!balanceAfter && accountType && runningBalance[accountType] !== undefined) {
        if (isDebit) {
          runningBalance[accountType] -= Math.abs(tx.amount);
        } else {
          runningBalance[accountType] += Math.abs(tx.amount);
        }
        balanceAfter = runningBalance[accountType];
      }
      
      return {
        _id: tx._id,
        type: tx.type,
        amount: Math.abs(tx.amount),
        adjustedAmount: adjustedAmount,
        description: tx.description,
        date: tx.date || tx.createdAt,
        status: tx.status,
        accountType: tx.accountType,
        reference: tx.reference,
        channel: tx.channel,
        origin: tx.origin,
        posted: tx.posted,
        postedAt: tx.postedAt,
        balanceAfter: balanceAfter,
        metadata: tx.metadata || {},
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt
      };
    });

    // Get transaction count for pagination
    const totalCount = await Transaction.countDocuments(query);

    // Calculate summary statistics
    const summary = {
      totalTransactions: totalCount,
      totalDebits: 0,
      totalCredits: 0,
      pendingCount: 0,
      completedCount: 0
    };

    formattedTransactions.forEach((tx: FormattedTransaction) => {
      if (tx.adjustedAmount < 0) {
        summary.totalDebits += Math.abs(tx.adjustedAmount);
      } else {
        summary.totalCredits += tx.adjustedAmount;
      }
      
      if (tx.status === 'pending') {
        summary.pendingCount++;
      } else if (tx.status === 'completed') {
        summary.completedCount++;
      }
    });

    return NextResponse.json({
      success: true,
      transactions: formattedTransactions,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      summary: {
        ...summary,
        netChange: summary.totalCredits - summary.totalDebits
      },
      currentBalances: {
        checking: user.checkingBalance || 0,
        savings: user.savingsBalance || 0,
        investment: user.investmentBalance || 0,
        total: (user.checkingBalance || 0) + (user.savingsBalance || 0) + (user.investmentBalance || 0)
      }
    });

  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { 
        error: "Failed to fetch transactions",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST - Create a new transaction WITH EMAIL NOTIFICATION
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, amount, description, accountType } = body;

    // Validate required fields
    if (!type || !amount || !accountType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Validate account type
    const validAccountTypes = ['checking', 'savings', 'investment'];
    if (!validAccountTypes.includes(accountType)) {
      return NextResponse.json(
        { error: "Invalid account type" },
        { status: 400 }
      );
    }

    // Get current balance
    const balanceField = `${accountType}Balance`;
    const currentBalance = user[balanceField] || 0;

    // Check if it's a debit transaction
    const debitTypes = ['transfer-out', 'withdrawal', 'payment', 'fee', 'charge', 'purchase'];
    const isDebit = debitTypes.includes(type);

    // Check sufficient funds for debits
    if (isDebit && Math.abs(amount) > currentBalance) {
      return NextResponse.json(
        { 
          error: "Insufficient funds",
          available: currentBalance,
          requested: Math.abs(amount)
        },
        { status: 400 }
      );
    }

    // Calculate new balance
    const newBalance = isDebit ? 
      currentBalance - Math.abs(amount) : 
      currentBalance + Math.abs(amount);

    // Start database transaction
    const mongoSession = await User.startSession();
    let savedTransaction: any = null;
    
    try {
      await mongoSession.withTransaction(async () => {
        // Create transaction record
        const transaction = new Transaction({
          userId: user._id,
          type,
          amount: Math.abs(amount),
          description: description || `${type.charAt(0).toUpperCase() + type.slice(1)} transaction`,
          status: 'completed',
          accountType,
          posted: true,
          postedAt: new Date(),
          reference: `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          channel: 'online',
          date: new Date(),
          balanceAfter: newBalance
        });

        savedTransaction = await transaction.save({ session: mongoSession });

        // Update user balance
        await User.findByIdAndUpdate(
          user._id,
          { $set: { [balanceField]: newBalance } },
          { session: mongoSession }
        );
      });

      await mongoSession.endSession();

      // SEND EMAIL NOTIFICATION AFTER SUCCESSFUL TRANSACTION
      console.log('[Transaction] Sending email notification for transaction:', savedTransaction.reference);
      
      try {
        const emailResult = await sendEnhancedTransactionNotification(
          user,
          savedTransaction,
          currentBalance, // balance before
          newBalance      // balance after
        );

        if (emailResult.failed) {
          console.error('[Transaction] Email failed but transaction succeeded:', emailResult.error);
        } else {
          console.log('[Transaction] Email sent successfully');
        }
      } catch (emailError) {
        console.error('[Transaction] Email error (transaction still successful):', emailError);
      }

      return NextResponse.json({
        success: true,
        message: "Transaction created successfully",
        transaction: {
          id: savedTransaction._id,
          reference: savedTransaction.reference,
          type: savedTransaction.type,
          amount: savedTransaction.amount,
          status: savedTransaction.status
        },
        newBalance,
        emailSent: true
      });

    } catch (dbError) {
      await mongoSession.abortTransaction();
      await mongoSession.endSession();
      throw dbError;
    }

  } catch (error: any) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { 
        error: "Failed to create transaction",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
