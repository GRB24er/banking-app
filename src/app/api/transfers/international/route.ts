// src/app/api/transfers/international/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";

// International Transfer Interface
interface InternationalTransferRequest {
  fromAccount: 'checking' | 'savings' | 'investment';
  recipientName: string;
  recipientAccount: string;
  recipientIBAN?: string; // For European transfers
  recipientSWIFT: string; // Required for international
  recipientBank: string;
  recipientBankAddress: string;
  recipientAddress: string;
  recipientCity: string;
  recipientCountry: string;
  recipientPostalCode: string;
  amount: number | string;
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'JPY' | 'AUD' | 'CHF'; // Target currency
  description?: string;
  purposeOfTransfer: string; // Required for international compliance
  transferSpeed: 'standard' | 'express';
  correspondentBank?: string; // Sometimes required
  correspondentBankSWIFT?: string;
}

// Exchange rates (in production, fetch from real API)
const EXCHANGE_RATES: { [key: string]: number } = {
  'USD': 1.0,
  'EUR': 0.85,
  'GBP': 0.73,
  'CAD': 1.35,
  'JPY': 110.0,
  'AUD': 1.45,
  'CHF': 0.92
};

export async function POST(request: NextRequest) {
  try {
    console.log('🌍 International transfer initiated');
    
    // Get session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.log('❌ Unauthorized international transfer attempt');
      return NextResponse.json(
        { 
          success: false,
          error: "Unauthorized - Please login" 
        },
        { status: 401 }
      );
    }

    // Parse request body
    const body: InternationalTransferRequest = await request.json();
    console.log('📥 International transfer request:', {
      fromAccount: body.fromAccount,
      recipientName: body.recipientName,
      recipientCountry: body.recipientCountry,
      amount: body.amount,
      currency: body.currency,
      transferSpeed: body.transferSpeed,
      userEmail: session.user.email
    });
    
    const { 
      fromAccount,
      recipientName,
      recipientAccount,
      recipientIBAN,
      recipientSWIFT,
      recipientBank,
      recipientBankAddress,
      recipientAddress,
      recipientCity,
      recipientCountry,
      recipientPostalCode,
      amount,
      currency,
      description,
      purposeOfTransfer,
      transferSpeed,
      correspondentBank,
      correspondentBankSWIFT
    } = body;

    // Enhanced validation for international transfers
    const missingFields = [];
    if (!fromAccount) missingFields.push('fromAccount');
    if (!recipientName?.trim()) missingFields.push('recipientName');
    if (!recipientAccount?.trim() && !recipientIBAN?.trim()) missingFields.push('recipientAccount or recipientIBAN');
    if (!recipientSWIFT?.trim()) missingFields.push('recipientSWIFT');
    if (!recipientBank?.trim()) missingFields.push('recipientBank');
    if (!recipientBankAddress?.trim()) missingFields.push('recipientBankAddress');
    if (!recipientAddress?.trim()) missingFields.push('recipientAddress');
    if (!recipientCity?.trim()) missingFields.push('recipientCity');
    if (!recipientCountry?.trim()) missingFields.push('recipientCountry');
    if (!recipientPostalCode?.trim()) missingFields.push('recipientPostalCode');
    if (!amount) missingFields.push('amount');
    if (!currency) missingFields.push('currency');
    if (!purposeOfTransfer?.trim()) missingFields.push('purposeOfTransfer');

    if (missingFields.length > 0) {
      console.log('❌ Missing required fields for international transfer:', missingFields);
      return NextResponse.json(
        { 
          success: false,
          error: `International transfers require complete recipient information. Missing: ${missingFields.join(', ')}`,
          missingFields 
        },
        { status: 400 }
      );
    }

    // Validate SWIFT code format (8 or 11 characters)
    if (recipientSWIFT && !/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(recipientSWIFT.toUpperCase())) {
      return NextResponse.json(
        { 
          success: false,
          error: "Invalid SWIFT code format. SWIFT codes should be 8 or 11 characters (e.g., CHASUS33)" 
        },
        { status: 400 }
      );
    }

    // Validate IBAN if provided
    if (recipientIBAN && !/^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/.test(recipientIBAN.toUpperCase().replace(/\s/g, ''))) {
      return NextResponse.json(
        { 
          success: false,
          error: "Invalid IBAN format. Please check the IBAN number" 
        },
        { status: 400 }
      );
    }

    // Validate currency
    if (!EXCHANGE_RATES[currency]) {
      return NextResponse.json(
        { 
          success: false,
          error: "Unsupported currency. Supported currencies: USD, EUR, GBP, CAD, JPY, AUD, CHF" 
        },
        { status: 400 }
      );
    }

    // Validate and parse amount
    const transferAmount = typeof amount === 'string' 
      ? parseFloat(amount.replace(/[^0-9.-]/g, '')) 
      : Number(amount);
      
    console.log('💰 International transfer amount:', transferAmount);

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

    // International transfer limits
    if (transferAmount < 50) {
      return NextResponse.json(
        { 
          success: false,
          error: "Minimum international transfer amount is $50.00" 
        },
        { status: 400 }
      );
    }

    if (transferAmount > 100000) {
      return NextResponse.json(
        { 
          success: false,
          error: "International transfers over $100,000 require additional compliance checks. Please contact support." 
        },
        { status: 400 }
      );
    }

    // Calculate exchange rate and fees
    const exchangeRate = EXCHANGE_RATES[currency];
    const convertedAmount = transferAmount * exchangeRate;
    
    // International transfer fees
    let transferFee = 25; // Base international transfer fee
    if (transferSpeed === 'express') {
      transferFee = 45; // Higher fee for express
    }
    
    // Additional fees for certain regions
    const highCostCountries = ['CN', 'RU', 'IN', 'BR', 'MX']; // Add country codes as needed
    if (highCostCountries.includes(recipientCountry.toUpperCase())) {
      transferFee += 15;
    }

    const totalAmount = transferAmount + transferFee;
    const estimatedCompletion = transferSpeed === 'express' ? '1-2 business days' : '3-5 business days';

    console.log('💱 International transfer details:', {
      transferAmount,
      currency,
      exchangeRate,
      convertedAmount,
      transferFee,
      totalAmount,
      transferSpeed,
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
          error: "Insufficient funds for international transfer",
          details: {
            available: currentBalance,
            transferAmount: transferAmount,
            transferFee: transferFee,
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
    const intlRef = `INTL-${timestamp}-${random}`;
    
    console.log('🔖 Generated international transfer reference:', intlRef);

    // Use MongoDB session for transaction consistency
    const mongoSession = await User.startSession();
    
    try {
      await mongoSession.withTransaction(async () => {
        console.log('🔄 Starting international transfer database transaction');

        // Create international transfer transaction
        const transferTransaction = new Transaction({
          userId: user._id,
          type: 'transfer-out',
          currency: 'USD', // Always deduct in USD from user account
          amount: transferAmount,
          description: description?.trim() || `International transfer to ${recipientName} in ${recipientCountry}`,
          status: transferSpeed === 'express' ? 'completed' : 'pending', // Express transfers processed immediately
          accountType: fromAccount,
          posted: transferSpeed === 'express', // Express transfers posted immediately
          postedAt: transferSpeed === 'express' ? new Date() : null,
          reference: intlRef,
          channel: 'online',
          origin: 'international_transfer',
          date: new Date(),
          metadata: {
            recipientName: recipientName.trim(),
            recipientAccount: recipientAccount?.trim(),
            recipientIBAN: recipientIBAN?.trim(),
            recipientSWIFT: recipientSWIFT.toUpperCase(),
            recipientBank: recipientBank.trim(),
            recipientBankAddress: recipientBankAddress.trim(),
            recipientAddress: recipientAddress.trim(),
            recipientCity: recipientCity.trim(),
            recipientCountry: recipientCountry.toUpperCase(),
            recipientPostalCode: recipientPostalCode.trim(),
            targetCurrency: currency,
            exchangeRate: exchangeRate,
            convertedAmount: convertedAmount,
            transferFee: transferFee,
            transferSpeed,
            purposeOfTransfer: purposeOfTransfer.trim(),
            estimatedCompletion,
            correspondentBank: correspondentBank?.trim(),
            correspondentBankSWIFT: correspondentBankSWIFT?.toUpperCase(),
            isInternationalTransfer: true,
            complianceChecked: true,
            // Store masked data for security
            maskedAccount: recipientAccount ? `****${recipientAccount.slice(-4)}` : null,
            maskedIBAN: recipientIBAN ? `****${recipientIBAN.slice(-4)}` : null
          }
        });

        await transferTransaction.save({ session: mongoSession });
        console.log('💾 International transfer transaction saved:', transferTransaction._id);

        // Create fee transaction
        const feeTransaction = new Transaction({
          userId: user._id,
          type: 'fee',
          currency: 'USD',
          amount: transferFee,
          description: `International transfer fee (${transferSpeed})`,
          status: transferSpeed === 'express' ? 'completed' : 'pending',
          accountType: fromAccount,
          posted: transferSpeed === 'express',
          postedAt: transferSpeed === 'express' ? new Date() : null,
          reference: `${intlRef}-FEE`,
          channel: 'online',
          origin: 'international_transfer',
          date: new Date(),
          metadata: {
            relatedTransferRef: intlRef,
            transferSpeed,
            targetCurrency: currency
          }
        });

        await feeTransaction.save({ session: mongoSession });
        console.log('💾 International transfer fee transaction saved:', feeTransaction._id);

        // Update user balance (deduct for express transfers, hold for standard)
        if (transferSpeed === 'express') {
          const newBalance = currentBalance - totalAmount;
          const updateField = { [fromBalanceField]: newBalance };
          
          await User.findByIdAndUpdate(
            user._id, 
            { $set: updateField },
            { session: mongoSession }
          );

          console.log('💰 Balance updated for express international transfer:', {
            field: fromBalanceField,
            oldBalance: currentBalance,
            newBalance: newBalance,
            deducted: totalAmount
          });

          // Add to user's transaction history (embedded)
          const userTransactionEntry = {
            _id: transferTransaction._id,
            type: 'transfer-out',
            amount: totalAmount,
            description: `International transfer to ${recipientName} (${currency})`,
            date: new Date(),
            balanceAfter: newBalance,
            status: 'completed',
            reference: intlRef
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
        } else {
          // For standard transfers, just add pending entry
          const userTransactionEntry = {
            _id: transferTransaction._id,
            type: 'transfer-out',
            amount: totalAmount,
            description: `Pending: International transfer to ${recipientName} (${currency})`,
            date: new Date(),
            balanceAfter: currentBalance, // Balance unchanged until processed
            status: 'pending',
            reference: intlRef
          };

          await User.findByIdAndUpdate(
            user._id,
            {
              $push: {
                transactions: {
                  $each: [userTransactionEntry],
                  $position: 0,
                  $slice: 100
                }
              }
            },
            { session: mongoSession }
          );
        }

        console.log('📝 User transaction history updated');
      });

      await mongoSession.endSession();
      console.log('✅ International transfer database transaction completed successfully');

      // Prepare response data
      const responseData = {
        success: true,
        message: transferSpeed === 'express' 
          ? `Express international transfer completed! Funds will be available to ${recipientName} within ${estimatedCompletion.toLowerCase()}.`
          : `International transfer initiated successfully. Pending compliance review. Funds will be available within ${estimatedCompletion.toLowerCase()}.`,
        transferReference: intlRef,
        transfer: {
          type: 'international',
          from: fromAccount,
          to: {
            name: recipientName,
            account: recipientAccount ? `****${recipientAccount.slice(-4)}` : null,
            iban: recipientIBAN ? `****${recipientIBAN.slice(-4)}` : null,
            swift: recipientSWIFT,
            bank: recipientBank,
            bankAddress: recipientBankAddress,
            city: recipientCity,
            country: recipientCountry,
            postalCode: recipientPostalCode,
            address: recipientAddress
          },
          amount: transferAmount,
          targetCurrency: currency,
          convertedAmount: convertedAmount,
          exchangeRate: exchangeRate,
          fee: transferFee,
          total: totalAmount,
          description: description || 'International Transfer',
          reference: intlRef,
          status: transferSpeed === 'express' ? 'completed' : 'pending',
          transferSpeed,
          estimatedCompletion: estimatedCompletion,
          purposeOfTransfer: purposeOfTransfer,
          date: new Date().toISOString(),
          processedImmediately: transferSpeed === 'express'
        },
        newBalance: transferSpeed === 'express' ? currentBalance - totalAmount : currentBalance,
        balanceInfo: {
          previousBalance: currentBalance,
          transferAmount: transferAmount,
          feeAmount: transferFee,
          newBalance: transferSpeed === 'express' ? currentBalance - totalAmount : currentBalance,
          balanceHeld: transferSpeed === 'standard' ? totalAmount : 0
        },
        exchangeInfo: {
          fromCurrency: 'USD',
          toCurrency: currency,
          exchangeRate: exchangeRate,
          usdAmount: transferAmount,
          convertedAmount: convertedAmount
        }
      };

      console.log('✅ International transfer completed:', {
        reference: intlRef,
        status: responseData.transfer.status,
        targetCurrency: currency,
        newBalance: responseData.newBalance
      });

      return NextResponse.json(responseData, { status: 200 });

    } catch (dbError: any) {
      await mongoSession.abortTransaction();
      await mongoSession.endSession();
      
      console.error('💥 International transfer database transaction failed:', {
        error: dbError.message,
        stack: dbError.stack,
        intlRef
      });
      
      return NextResponse.json(
        { 
          success: false,
          error: "Failed to process international transfer. Please try again.",
          details: process.env.NODE_ENV === 'development' ? dbError.message : undefined,
          reference: intlRef
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('💥 International transfer error:', {
      message: error.message,
      stack: error.stack,
      userEmail: (await getServerSession(authOptions))?.user?.email
    });
    
    return NextResponse.json(
      { 
        success: false,
        error: "An unexpected error occurred with international transfer. Please try again.",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// GET - Fetch international transfer history
export async function GET(request: NextRequest) {
  try {
    console.log('📊 Fetching international transfer history');
    
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
    const currency = searchParams.get('currency');
    const country = searchParams.get('country');

    // Build query for international transfers
    const query: any = {
      userId: user._id,
      type: 'transfer-out',
      origin: 'international_transfer'
    };

    if (currency) {
      query['metadata.targetCurrency'] = currency.toUpperCase();
    }
    if (country) {
      query['metadata.recipientCountry'] = country.toUpperCase();
    }

    console.log('🔍 International transfer query filters:', query);

    // Get international transfers with related fee transactions
    const intlTransfers = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Get related fee transactions
    const intlRefs = intlTransfers.map((t: any) => t.reference);
    const feeTransactions = await Transaction.find({
      userId: user._id,
      type: 'fee',
      origin: 'international_transfer',
      reference: { $in: intlRefs.map((ref: any) => `${ref}-FEE`) }
    }).lean();

    // Create a map for quick fee lookup
    const feeMap = feeTransactions.reduce((acc: { [key: string]: any }, fee: any) => {
  const mainRef = fee.reference?.replace('-FEE', '');
  if (mainRef) acc[mainRef] = fee;
  return acc;
}, {} as { [key: string]: any });

    // Format international transfers with enhanced data
    const intlHistory = intlTransfers.map((tx: any) => {
      const relatedFee = feeMap[tx.reference];
      
      return {
        id: tx._id.toString(),
        reference: tx.reference,
        date: tx.date || tx.createdAt,
        amount: tx.amount,
        fee: relatedFee?.amount || tx.metadata?.transferFee || 0,
        total: tx.amount + (relatedFee?.amount || tx.metadata?.transferFee || 0),
        fromAccount: tx.accountType,
        targetCurrency: tx.metadata?.targetCurrency || 'USD',
        convertedAmount: tx.metadata?.convertedAmount || tx.amount,
        exchangeRate: tx.metadata?.exchangeRate || 1,
        recipient: {
          name: tx.metadata?.recipientName || 'Unknown',
          account: tx.metadata?.maskedAccount || '****',
          iban: tx.metadata?.maskedIBAN || null,
          swift: tx.metadata?.recipientSWIFT || 'Unknown',
          bank: tx.metadata?.recipientBank || 'Unknown Bank',
          city: tx.metadata?.recipientCity || 'Unknown',
          country: tx.metadata?.recipientCountry || 'Unknown',
          address: tx.metadata?.recipientAddress || 'Unknown'
        },
        bankDetails: {
          name: tx.metadata?.recipientBank || 'Unknown Bank',
          address: tx.metadata?.recipientBankAddress || 'Unknown',
          swift: tx.metadata?.recipientSWIFT || 'Unknown'
        },
        correspondentBank: {
          name: tx.metadata?.correspondentBank || null,
          swift: tx.metadata?.correspondentBankSWIFT || null
        },
        status: tx.status,
        transferSpeed: tx.metadata?.transferSpeed || 'standard',
        purposeOfTransfer: tx.metadata?.purposeOfTransfer || 'Not specified',
        estimatedCompletion: tx.metadata?.estimatedCompletion || '3-5 business days',
        description: tx.description,
        posted: tx.posted,
        postedAt: tx.postedAt,
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt
      };
    });

    console.log(`📋 Found ${intlHistory.length} international transfers`);

    // Calculate summary statistics
    const completedTransfers = intlHistory.filter((t: any) => t.status === 'completed');
    const currencySummary = intlHistory.reduce((acc: any, t: any) => {
  const curr = t.targetCurrency;
  if (!acc[curr]) acc[curr] = { count: 0, totalAmount: 0 };
  acc[curr].count++;
  acc[curr].totalAmount += t.convertedAmount;
  return acc;
}, {} as { [key: string]: { count: number; totalAmount: number } });

    return NextResponse.json({
      success: true,
      internationalTransfers: intlHistory,
      total: intlHistory.length,
      pagination: {
        limit,
        hasMore: intlHistory.length === limit
      },
      currentBalances: {
        checking: user.checkingBalance || 0,
        savings: user.savingsBalance || 0,
        investment: user.investmentBalance || 0
      },
      summary: {
        totalTransfers: intlHistory.length,
        completedTransfers: completedTransfers.length,
        pendingTransfers: intlHistory.filter((t: any) => t.status === 'pending').length,
        expressTransfers: intlHistory.filter((t: any) => t.transferSpeed === 'express').length,
        totalUsdSent: completedTransfers.reduce((sum: number, t: any) => sum + t.total, 0),
        currencySummary
      },
      supportedCurrencies: Object.keys(EXCHANGE_RATES).map(code => ({
        code,
        rate: EXCHANGE_RATES[code],
        name: getCurrencyName(code)
      }))
    });

  } catch (error: any) {
    console.error('💥 Get international transfers error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch international transfer history",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Helper function to get currency names
function getCurrencyName(code: string): string {
  const currencyNames: { [key: string]: string } = {
    'USD': 'US Dollar',
    'EUR': 'Euro',
    'GBP': 'British Pound',
    'CAD': 'Canadian Dollar',
    'JPY': 'Japanese Yen',
    'AUD': 'Australian Dollar',
    'CHF': 'Swiss Franc'
  };
  return currencyNames[code] || code;
}
