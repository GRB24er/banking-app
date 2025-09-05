// src/app/api/transfers/external/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";

// Define interfaces for better type safety
interface ExternalTransferRequest {
  fromAccount: 'checking' | 'savings' | 'investment';
  recipientName: string;
  recipientAccount: string;
  recipientBank: string;
  recipientRoutingNumber?: string;
  amount: number | string;
  description?: string;
  transferSpeed?: 'standard' | 'express' | 'wire';
}

interface TransferFeeStructure {
  fee: number;
  estimatedDays: string;
}

interface TransferDocument {
  _id: any;
  reference: string;
  date: Date;
  createdAt: Date;
  amount: number;
  accountType: string;
  status: string;
  posted: boolean;
  postedAt: Date | null;
  description: string;
  metadata?: {
    recipientName?: string;
    recipientAccount?: string;
    recipientBank?: string;
    fee?: number;
    transferSpeed?: string;
    estimatedCompletion?: string;
  };
  updatedAt: Date;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 External transfer initiated');
    
    // Get session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.log('❌ Unauthorized access attempt');
      return NextResponse.json(
        { 
          success: false,
          error: "Unauthorized - Please login" 
        },
        { status: 401 }
      );
    }

    // Parse request body with detailed logging
    const body: ExternalTransferRequest = await request.json();
    console.log('📥 Transfer request received:', {
      fromAccount: body.fromAccount,
      recipientName: body.recipientName,
      amount: body.amount,
      transferSpeed: body.transferSpeed,
      userEmail: session.user.email
    });
    
    // Destructure with validation
    const { 
      fromAccount,
      recipientName,
      recipientAccount,
      recipientBank,
      recipientRoutingNumber,
      amount,
      description,
      transferSpeed = 'standard'
    } = body;

    // Enhanced field validation with specific error messages
    const missingFields = [];
    if (!fromAccount) missingFields.push('fromAccount');
    if (!recipientName?.trim()) missingFields.push('recipientName');
    if (!recipientAccount?.trim()) missingFields.push('recipientAccount');
    if (!recipientBank?.trim()) missingFields.push('recipientBank');
    if (!amount) missingFields.push('amount');

    if (missingFields.length > 0) {
      console.log('❌ Missing required fields:', missingFields);
      return NextResponse.json(
        { 
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`,
          missingFields 
        },
        { status: 400 }
      );
    }

    // Validate and parse amount
    const transferAmount = typeof amount === 'string' 
      ? parseFloat(amount.replace(/[^0-9.-]/g, '')) 
      : Number(amount);
      
    console.log('💰 Parsed amount:', transferAmount);

    if (isNaN(transferAmount) || transferAmount <= 0) {
      console.log('❌ Invalid amount:', amount);
      return NextResponse.json(
        { 
          success: false,
          error: "Invalid amount. Please enter a valid number greater than 0" 
        },
        { status: 400 }
      );
    }

    // Minimum transfer validation
    if (transferAmount < 1) {
      return NextResponse.json(
        { 
          success: false,
          error: "Minimum transfer amount is $1.00" 
        },
        { status: 400 }
      );
    }

    // Maximum transfer validation
    if (transferAmount > 50000) {
      return NextResponse.json(
        { 
          success: false,
          error: "Maximum transfer amount is $50,000.00. Please contact support for larger transfers." 
        },
        { status: 400 }
      );
    }

    // Calculate fees and processing time
    const feeStructure: { [key: string]: TransferFeeStructure } = {
      'standard': { fee: 0, estimatedDays: '3-5 business days' },
      'express': { fee: 15, estimatedDays: '1-2 business days' },
      'wire': { fee: 30, estimatedDays: 'Same business day' }
    };

    const { fee, estimatedDays } = feeStructure[transferSpeed] || feeStructure['standard'];
    const totalAmount = transferAmount + fee;

    console.log('💸 Transfer details:', {
      transferAmount,
      fee,
      totalAmount,
      transferSpeed,
      estimatedDays
    });

    // Connect to database
    await connectDB();
    console.log('🗄️ Database connected');

    // Find and validate user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      console.log('❌ User not found:', session.user.email);
      return NextResponse.json(
        { 
          success: false,
          error: "User account not found" 
        },
        { status: 404 }
      );
    }

    console.log('👤 User found:', user._id);

    // Validate account type and get balance
    const balanceFieldMap: { [key: string]: keyof typeof user } = {
      'checking': 'checkingBalance',
      'savings': 'savingsBalance',
      'investment': 'investmentBalance'
    };

    const fromBalanceField = balanceFieldMap[fromAccount];
    if (!fromBalanceField) {
      console.log('❌ Invalid account type:', fromAccount);
      return NextResponse.json(
        { 
          success: false,
          error: "Invalid account type. Must be checking, savings, or investment" 
        },
        { status: 400 }
      );
    }

    // Check sufficient funds
    const currentBalance = Number(user[fromBalanceField] || 0);
    console.log('💰 Current balance check:', {
      account: fromAccount,
      currentBalance,
      requiredAmount: totalAmount,
      hasSufficientFunds: currentBalance >= totalAmount
    });
    
    if (totalAmount > currentBalance) {
      return NextResponse.json(
        { 
          success: false,
          error: "Insufficient funds",
          details: {
            available: currentBalance,
            transferAmount: transferAmount,
            fee: fee,
            totalRequired: totalAmount,
            shortfall: totalAmount - currentBalance
          }
        },
        { status: 400 }
      );
    }

    // Generate unique reference number
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const transferRef = `EXT-${timestamp}-${random}`;
    
    console.log('📖 Generated reference:', transferRef);

    // Use MongoDB session for transaction consistency
    const mongoSession = await User.startSession();
    
    try {
      await mongoSession.withTransaction(async () => {
        console.log('🔄 Starting database transaction');

        // Create main transfer transaction
        const mainTransaction = new Transaction({
          userId: user._id,
          type: 'transfer-out',
          currency: 'USD',
          amount: transferAmount,
          description: description?.trim() || `External transfer to ${recipientName}`,
          status: transferSpeed === 'wire' ? 'completed' : 'pending', // Wire transfers are immediate
          accountType: fromAccount,
          posted: transferSpeed === 'wire', // Wire transfers are posted immediately
          postedAt: transferSpeed === 'wire' ? new Date() : null,
          reference: transferRef,
          channel: 'online',
          origin: 'external_transfer',
          date: new Date(),
          metadata: {
            recipientName: recipientName.trim(),
            recipientAccount: recipientAccount.slice(-4), // Store only last 4 digits
            recipientBank: recipientBank.trim(),
            recipientRoutingNumber: recipientRoutingNumber ? recipientRoutingNumber.slice(-4) : '',
            transferSpeed,
            fee,
            estimatedCompletion: estimatedDays,
            isExternalTransfer: true,
            fullRecipientAccount: recipientAccount // Store full account for admin use
          }
        });

        await mainTransaction.save({ session: mongoSession });
        console.log('💾 Main transaction saved:', mainTransaction._id);

        // Create fee transaction if applicable
        let feeTransaction = null;
        if (fee > 0) {
          feeTransaction = new Transaction({
            userId: user._id,
            type: 'fee',
            currency: 'USD',
            amount: fee,
            description: `${transferSpeed.charAt(0).toUpperCase() + transferSpeed.slice(1)} transfer fee`,
            status: transferSpeed === 'wire' ? 'completed' : 'pending',
            accountType: fromAccount,
            posted: transferSpeed === 'wire',
            postedAt: transferSpeed === 'wire' ? new Date() : null,
            reference: `${transferRef}-FEE`,
            channel: 'online',
            origin: 'external_transfer',
            date: new Date(),
            metadata: {
              relatedTransferRef: transferRef,
              transferSpeed
            }
          });

          await feeTransaction.save({ session: mongoSession });
          console.log('💾 Fee transaction saved:', feeTransaction._id);
        }

        // Update user balance
        const newBalance = currentBalance - totalAmount;
        const updateField = { [fromBalanceField]: newBalance };
        
        await User.findByIdAndUpdate(
          user._id, 
          { $set: updateField },
          { session: mongoSession }
        );

        console.log('💰 Balance updated:', {
          field: fromBalanceField,
          oldBalance: currentBalance,
          newBalance: newBalance,
          deducted: totalAmount
        });

        // Add to user's transaction history (embedded)
        const userTransactionEntry = {
          _id: mainTransaction._id,
          type: 'transfer-out',
          amount: totalAmount,
          description: `External transfer to ${recipientName}`,
          date: new Date(),
          balanceAfter: newBalance,
          status: mainTransaction.status,
          reference: transferRef
        };

        await User.findByIdAndUpdate(
          user._id,
          {
            $push: {
              transactions: {
                $each: [userTransactionEntry],
                $position: 0,
                $slice: 100 // Keep only last 100 transactions
              }
            }
          },
          { session: mongoSession }
        );

        console.log('📝 User transaction history updated');
      });

      await mongoSession.endSession();
      console.log('✅ Database transaction completed successfully');

      // Prepare response data
      const responseData = {
        success: true,
        message: transferSpeed === 'wire' 
          ? "Wire transfer completed successfully!" 
          : "Transfer initiated successfully. Pending admin approval.",
        transferReference: transferRef,
        transfer: {
          from: fromAccount,
          to: {
            name: recipientName,
            account: `****${recipientAccount.slice(-4)}`,
            bank: recipientBank
          },
          amount: transferAmount,
          fee: fee,
          total: totalAmount,
          description: description || 'External Transfer',
          reference: transferRef,
          status: transferSpeed === 'wire' ? 'completed' : 'pending',
          estimatedCompletion: estimatedDays,
          transferSpeed,
          date: new Date().toISOString()
        },
        newBalance: currentBalance - totalAmount,
        balanceInfo: {
          previousBalance: currentBalance,
          transferAmount: transferAmount,
          feeAmount: fee,
          newBalance: currentBalance - totalAmount
        }
      };

      console.log('✅ Transfer completed:', {
        reference: transferRef,
        status: responseData.transfer.status,
        newBalance: responseData.newBalance
      });

      return NextResponse.json(responseData, { status: 200 });

    } catch (dbError: any) {
      await mongoSession.abortTransaction();
      await mongoSession.endSession();
      
      console.error('💥 Database transaction failed:', {
        error: dbError.message,
        stack: dbError.stack,
        transferRef
      });
      
      return NextResponse.json(
        { 
          success: false,
          error: "Failed to process transfer. Please try again.",
          details: process.env.NODE_ENV === 'development' ? dbError.message : undefined,
          reference: transferRef
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('💥 External transfer error:', {
      message: error.message,
      stack: error.stack,
      userEmail: (await getServerSession(authOptions))?.user?.email
    });
    
    return NextResponse.json(
      { 
        success: false,
        error: "An unexpected error occurred. Please try again.",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// GET - Fetch external transfer history with enhanced filtering
export async function GET(request: NextRequest) {
  try {
    console.log('📊 Fetching external transfer history');
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { 
          success: false,
          error: "Unauthorized" 
        },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { 
          success: false,
          error: "User not found" 
        },
        { status: 404 }
      );
    }

    // Get URL parameters for filtering
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const accountType = searchParams.get('accountType');

    // Build query
    const query: any = {
      userId: user._id,
      type: 'transfer-out',
      origin: 'external_transfer'
    };

    if (status) query.status = status;
    if (accountType) query.accountType = accountType;

    console.log('🔍 Query filters:', query);

    // Get external transfers with related fee transactions
    const transfers: TransferDocument[] = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Get related fee transactions - FIXED: Added proper typing
    const transferRefs = transfers.map((t: TransferDocument) => t.reference);
    const feeTransactions = await Transaction.find({
      userId: user._id,
      type: 'fee',
      origin: 'external_transfer',
      reference: { $in: transferRefs.map(ref => `${ref}-FEE`) }
    }).lean();

    // Create a map for quick fee lookup
const feeMap = feeTransactions.reduce((acc: { [key: string]: any }, fee: any) => {
  const mainRef = fee.reference?.replace('-FEE', '');
  if (mainRef) acc[mainRef] = fee;
  return acc;
}, {} as { [key: string]: any });

    // Format transfers with enhanced data - FIXED: Added proper typing
    const transferHistory = transfers.map((tx: TransferDocument) => {
      const relatedFee = feeMap[tx.reference];
      
      return {
        id: tx._id.toString(),
        reference: tx.reference,
        date: tx.date || tx.createdAt,
        amount: tx.amount,
        fee: relatedFee?.amount || tx.metadata?.fee || 0,
        total: tx.amount + (relatedFee?.amount || tx.metadata?.fee || 0),
        fromAccount: tx.accountType,
        recipient: {
          name: tx.metadata?.recipientName || 'Unknown',
          account: tx.metadata?.recipientAccount ? `****${tx.metadata.recipientAccount}` : '****',
          bank: tx.metadata?.recipientBank || 'Unknown Bank'
        },
        status: tx.status,
        transferSpeed: tx.metadata?.transferSpeed || 'standard',
        estimatedCompletion: tx.metadata?.estimatedCompletion || 'Unknown',
        description: tx.description,
        posted: tx.posted,
        postedAt: tx.postedAt,
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt
      };
    });

    console.log(`📋 Found ${transferHistory.length} transfers`);

    return NextResponse.json({
      success: true,
      transfers: transferHistory,
      total: transferHistory.length,
      pagination: {
        limit,
        hasMore: transferHistory.length === limit
      },
      currentBalances: {
        checking: user.checkingBalance || 0,
        savings: user.savingsBalance || 0,
        investment: user.investmentBalance || 0
      },
      summary: {
        totalTransfers: transferHistory.length,
        pendingTransfers: transferHistory.filter(t => t.status === 'pending').length,
        completedTransfers: transferHistory.filter(t => t.status === 'completed').length,
        totalAmountTransferred: transferHistory
          .filter(t => t.status === 'completed')
          .reduce((sum, t) => sum + t.total, 0)
      }
    });

  } catch (error: any) {
    console.error('💥 Get external transfers error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch transfer history",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
