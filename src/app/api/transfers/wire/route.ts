// src/app/api/transfers/wire/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";

// Wire Transfer Interface
interface WireTransferRequest {
  fromAccount: 'checking' | 'savings' | 'investment';
  recipientName: string;
  recipientAccount: string;
  recipientBank: string;
  recipientRoutingNumber: string; // Required for wire transfers
  recipientBankAddress: string;
  amount: number | string;
  description?: string;
  wireType: 'domestic' | 'international';
  recipientAddress?: string; // Required for wire transfers
  purposeOfTransfer?: string;
  urgentTransfer?: boolean; // For same-day processing
}

export async function POST(request: NextRequest) {
  try {
    console.log('🏦 Wire transfer initiated');
    
    // Get session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.log('❌ Unauthorized wire transfer attempt');
      return NextResponse.json(
        { 
          success: false,
          error: "Unauthorized - Please login" 
        },
        { status: 401 }
      );
    }

    // Parse request body
    const body: WireTransferRequest = await request.json();
    console.log('📥 Wire transfer request:', {
      fromAccount: body.fromAccount,
      recipientName: body.recipientName,
      amount: body.amount,
      wireType: body.wireType,
      urgentTransfer: body.urgentTransfer,
      userEmail: session.user.email
    });
    
    const { 
      fromAccount,
      recipientName,
      recipientAccount,
      recipientBank,
      recipientRoutingNumber,
      recipientBankAddress,
      recipientAddress,
      amount,
      description,
      wireType,
      purposeOfTransfer,
      urgentTransfer = false
    } = body;

    // Enhanced validation for wire transfers
    const missingFields = [];
    if (!fromAccount) missingFields.push('fromAccount');
    if (!recipientName?.trim()) missingFields.push('recipientName');
    if (!recipientAccount?.trim()) missingFields.push('recipientAccount');
    if (!recipientBank?.trim()) missingFields.push('recipientBank');
    if (!recipientRoutingNumber?.trim()) missingFields.push('recipientRoutingNumber');
    if (!recipientBankAddress?.trim()) missingFields.push('recipientBankAddress');
    if (!amount) missingFields.push('amount');

    // Additional requirements for wire transfers
    if (!recipientAddress?.trim()) missingFields.push('recipientAddress');
    if (!purposeOfTransfer?.trim()) missingFields.push('purposeOfTransfer');

    if (missingFields.length > 0) {
      console.log('❌ Missing required fields for wire transfer:', missingFields);
      return NextResponse.json(
        { 
          success: false,
          error: `Wire transfers require additional information. Missing: ${missingFields.join(', ')}`,
          missingFields 
        },
        { status: 400 }
      );
    }

    // Validate and parse amount
    const transferAmount = typeof amount === 'string' 
      ? parseFloat(amount.replace(/[^0-9.-]/g, '')) 
      : Number(amount);
      
    console.log('💰 Wire transfer amount:', transferAmount);

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

    // Wire transfer limits
    if (transferAmount < 100) {
      return NextResponse.json(
        { 
          success: false,
          error: "Minimum wire transfer amount is $100.00" 
        },
        { status: 400 }
      );
    }

    if (transferAmount > 250000) {
      return NextResponse.json(
        { 
          success: false,
          error: "Wire transfers over $250,000 require additional approval. Please contact support." 
        },
        { status: 400 }
      );
    }

    // Wire transfer fees
    let wireFee = 30; // Standard domestic wire fee
    if (wireType === 'international') {
      wireFee = 45; // Higher fee for international
    }
    if (urgentTransfer) {
      wireFee += 25; // Rush processing fee
    }

    const totalAmount = transferAmount + wireFee;
    const estimatedCompletion = urgentTransfer ? 'Same business day (urgent)' : 'Same business day';

    console.log('💸 Wire transfer details:', {
      transferAmount,
      wireFee,
      totalAmount,
      wireType,
      urgentTransfer,
      estimatedCompletion
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

    // Get balance field
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
          error: "Insufficient funds for wire transfer",
          details: {
            available: currentBalance,
            transferAmount: transferAmount,
            wireFee: wireFee,
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
    const wireRef = `WIRE-${timestamp}-${random}`;
    
    console.log('🔖 Generated wire reference:', wireRef);

    // Use MongoDB session for transaction consistency
    const mongoSession = await User.startSession();
    
    try {
      await mongoSession.withTransaction(async () => {
        console.log('🔄 Starting wire transfer database transaction');

        // Create wire transfer transaction (COMPLETED immediately - wires are processed same day)
        const wireTransaction = new Transaction({
          userId: user._id,
          type: 'transfer-out',
          currency: 'USD',
          amount: transferAmount,
          description: description?.trim() || `${wireType === 'international' ? 'International' : 'Domestic'} wire transfer to ${recipientName}`,
          status: 'completed', // Wire transfers are processed immediately
          accountType: fromAccount,
          posted: true, // Posted immediately
          postedAt: new Date(),
          reference: wireRef,
          channel: 'online',
          origin: 'wire_transfer',
          date: new Date(),
          metadata: {
            wireType,
            recipientName: recipientName.trim(),
            recipientAccount: recipientAccount.slice(-4), // Store only last 4 digits
            recipientBank: recipientBank.trim(),
            recipientRoutingNumber: recipientRoutingNumber.slice(-4),
            recipientBankAddress: recipientBankAddress.trim(),
            recipientAddress: recipientAddress?.trim() || '',
purposeOfTransfer: purposeOfTransfer?.trim() || '',
            wireFee,
            urgentTransfer,
            estimatedCompletion,
            isWireTransfer: true,
            fullRecipientAccount: recipientAccount, // Store full account for admin use
            fullRoutingNumber: recipientRoutingNumber // Store full routing for admin use
          }
        });

        await wireTransaction.save({ session: mongoSession });
        console.log('💾 Wire transaction saved:', wireTransaction._id);

        // Create wire fee transaction
        const feeTransaction = new Transaction({
          userId: user._id,
          type: 'fee',
          currency: 'USD',
          amount: wireFee,
          description: `${wireType === 'international' ? 'International' : 'Domestic'} wire transfer fee${urgentTransfer ? ' (urgent)' : ''}`,
          status: 'completed',
          accountType: fromAccount,
          posted: true,
          postedAt: new Date(),
          reference: `${wireRef}-FEE`,
          channel: 'online',
          origin: 'wire_transfer',
          date: new Date(),
          metadata: {
            relatedWireRef: wireRef,
            wireType,
            urgentTransfer
          }
        });

        await feeTransaction.save({ session: mongoSession });
        console.log('💾 Wire fee transaction saved:', feeTransaction._id);

        // Update user balance (deduct immediately)
        const newBalance = currentBalance - totalAmount;
        const updateField = { [fromBalanceField]: newBalance };
        
        await User.findByIdAndUpdate(
          user._id, 
          { $set: updateField },
          { session: mongoSession }
        );

        console.log('💰 Balance updated for wire transfer:', {
          field: fromBalanceField,
          oldBalance: currentBalance,
          newBalance: newBalance,
          deducted: totalAmount
        });

        // Add to user's transaction history (embedded)
        const userTransactionEntry = {
          _id: wireTransaction._id,
          type: 'transfer-out',
          amount: totalAmount,
          description: `${wireType === 'international' ? 'International' : 'Domestic'} wire to ${recipientName}`,
          date: new Date(),
          balanceAfter: newBalance,
          status: 'completed',
          reference: wireRef
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
      console.log('✅ Wire transfer database transaction completed successfully');

      // Prepare response data
      const responseData = {
        success: true,
        message: `${wireType === 'international' ? 'International' : 'Domestic'} wire transfer completed successfully! Funds will be available to the recipient within ${estimatedCompletion.toLowerCase()}.`,
        wireReference: wireRef,
        transfer: {
          type: 'wire',
          wireType,
          from: fromAccount,
          to: {
            name: recipientName,
            account: `****${recipientAccount.slice(-4)}`,
            bank: recipientBank,
            routingNumber: `****${recipientRoutingNumber.slice(-4)}`,
            address: recipientBankAddress
          },
          recipient: {
            name: recipientName,
            address: recipientAddress
          },
          amount: transferAmount,
          fee: wireFee,
          total: totalAmount,
          description: description || `${wireType === 'international' ? 'International' : 'Domestic'} Wire Transfer`,
          reference: wireRef,
          status: 'completed',
          estimatedCompletion: estimatedCompletion,
          urgentTransfer,
          purposeOfTransfer,
          date: new Date().toISOString(),
          processedImmediately: true
        },
        newBalance: currentBalance - totalAmount,
        balanceInfo: {
          previousBalance: currentBalance,
          transferAmount: transferAmount,
          feeAmount: wireFee,
          newBalance: currentBalance - totalAmount
        }
      };

      console.log('✅ Wire transfer completed:', {
        reference: wireRef,
        type: wireType,
        status: 'completed',
        newBalance: responseData.newBalance
      });

      return NextResponse.json(responseData, { status: 200 });

    } catch (dbError: any) {
      await mongoSession.abortTransaction();
      await mongoSession.endSession();
      
      console.error('💥 Wire transfer database transaction failed:', {
        error: dbError.message,
        stack: dbError.stack,
        wireRef
      });
      
      return NextResponse.json(
        { 
          success: false,
          error: "Failed to process wire transfer. Please try again.",
          details: process.env.NODE_ENV === 'development' ? dbError.message : undefined,
          reference: wireRef
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('💥 Wire transfer error:', {
      message: error.message,
      stack: error.stack,
      userEmail: (await getServerSession(authOptions))?.user?.email
    });
    
    return NextResponse.json(
      { 
        success: false,
        error: "An unexpected error occurred with wire transfer. Please try again.",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// GET - Fetch wire transfer history
export async function GET(request: NextRequest) {
  try {
    console.log('📊 Fetching wire transfer history');
    
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
    const wireType = searchParams.get('wireType'); // domestic or international

    // Build query for wire transfers
    const query: any = {
      userId: user._id,
      type: 'transfer-out',
      origin: 'wire_transfer'
    };

    if (wireType) {
      query['metadata.wireType'] = wireType;
    }

    console.log('🔍 Wire transfer query filters:', query);

    // Get wire transfers with related fee transactions
    const wireTransfers = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Get related fee transactions
    const wireRefs = wireTransfers.map((t: any) => t.reference);
    const feeTransactions = await Transaction.find({
      userId: user._id,
      type: 'fee',
      origin: 'wire_transfer',
      reference: { $in: wireRefs.map((ref: any) => `${ref}-FEE`) }
    }).lean();

    // Create a map for quick fee lookup
    const feeMap = feeTransactions.reduce((acc: { [key: string]: any }, fee: any) => {
  const mainRef = fee.reference?.replace('-FEE', '');
  if (mainRef) acc[mainRef] = fee;
  return acc;
}, {} as { [key: string]: any });

    // Format wire transfers with enhanced data
    const wireHistory = wireTransfers.map((tx: any) => {
      const relatedFee = feeMap[tx.reference];
      
      return {
        id: tx._id.toString(),
        reference: tx.reference,
        date: tx.date || tx.createdAt,
        amount: tx.amount,
        fee: relatedFee?.amount || tx.metadata?.wireFee || 0,
        total: tx.amount + (relatedFee?.amount || tx.metadata?.wireFee || 0),
        fromAccount: tx.accountType,
        wireType: tx.metadata?.wireType || 'domestic',
        recipient: {
          name: tx.metadata?.recipientName || 'Unknown',
          account: tx.metadata?.recipientAccount ? `****${tx.metadata.recipientAccount}` : '****',
          bank: tx.metadata?.recipientBank || 'Unknown Bank',
          routingNumber: tx.metadata?.recipientRoutingNumber ? `****${tx.metadata.recipientRoutingNumber}` : '****',
          address: tx.metadata?.recipientAddress || 'Unknown'
        },
        bankDetails: {
          name: tx.metadata?.recipientBank || 'Unknown Bank',
          address: tx.metadata?.recipientBankAddress || 'Unknown'
        },
        status: tx.status,
        urgentTransfer: tx.metadata?.urgentTransfer || false,
        purposeOfTransfer: tx.metadata?.purposeOfTransfer || 'Not specified',
        estimatedCompletion: tx.metadata?.estimatedCompletion || 'Same business day',
        description: tx.description,
        posted: tx.posted,
        postedAt: tx.postedAt,
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt
      };
    });

    console.log(`📋 Found ${wireHistory.length} wire transfers`);

    return NextResponse.json({
      success: true,
      wireTransfers: wireHistory,
      total: wireHistory.length,
      pagination: {
        limit,
        hasMore: wireHistory.length === limit
      },
      currentBalances: {
        checking: user.checkingBalance || 0,
        savings: user.savingsBalance || 0,
        investment: user.investmentBalance || 0
      },
      summary: {
        totalWireTransfers: wireHistory.length,
        completedWires: wireHistory.filter((t: any) => t.status === 'completed').length,
        domesticWires: wireHistory.filter((t: any) => t.wireType === 'domestic').length,
        internationalWires: wireHistory.filter((t: any) => t.wireType === 'international').length,
        totalAmountWired: wireHistory
  .filter((t: any) => t.status === 'completed')
  .reduce((sum: number, t: any) => sum + t.total, 0)
      }
    });

  } catch (error: any) {
    console.error('💥 Get wire transfers error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch wire transfer history",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
