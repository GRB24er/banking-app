import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import CryptoWallet from '@/models/CryptoWallet';
import CryptoTransaction from '@/models/CryptoTransaction';
import { getCryptoPrice, SUPPORTED_CRYPTOS } from '@/lib/cryptoPrices';
import { sendTransactionEmail } from '@/lib/mail';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fromCrypto, toAccount = 'checking', cryptoAmount } = body;

    // Validation
    if (!fromCrypto || !SUPPORTED_CRYPTOS.includes(fromCrypto.toUpperCase())) {
      return NextResponse.json({ success: false, error: 'Unsupported cryptocurrency' }, { status: 400 });
    }

    const amount = typeof cryptoAmount === 'string'
      ? parseFloat(cryptoAmount)
      : Number(cryptoAmount);

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Get wallet
    const wallet = await CryptoWallet.findOne({ userId: user._id });
    if (!wallet) {
      return NextResponse.json({ success: false, error: 'Crypto wallet not found' }, { status: 404 });
    }

    const cryptoSymbol = fromCrypto.toUpperCase();
    const balanceIndex = wallet.balances.findIndex((b: any) => b.symbol === cryptoSymbol);

    if (balanceIndex < 0) {
      return NextResponse.json({ success: false, error: `No ${cryptoSymbol} balance found` }, { status: 400 });
    }

    const available = wallet.balances[balanceIndex].balance - (wallet.balances[balanceIndex].lockedBalance || 0);

    if (amount > available) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient crypto balance',
        available,
      }, { status: 400 });
    }

    // Get crypto price and calculate USD value
    const cryptoPrice = await getCryptoPrice(cryptoSymbol);
    const grossUsd = amount * cryptoPrice;
    const conversionFee = grossUsd * 0.01; // 1% fee
    const netUsd = grossUsd - conversionFee;

    if (netUsd < 1) {
      return NextResponse.json({ success: false, error: 'Amount too small. Minimum sale must yield at least $1.00' }, { status: 400 });
    }

    // Generate reference
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const reference = `SELL-${timestamp}-${random}`;

    // Deduct crypto from wallet
    wallet.balances[balanceIndex].balance -= amount;
    await wallet.save();

    // Credit USD to bank account
    const balanceField = toAccount === 'savings' ? 'savingsBalance' :
                         toAccount === 'investment' ? 'investmentBalance' : 'checkingBalance';
    await User.findByIdAndUpdate(user._id, {
      $inc: { [balanceField]: netUsd }
    });

    // Create transaction record
    await CryptoTransaction.create({
      userId: user._id,
      type: 'conversion',
      status: 'completed',
      fromCurrency: cryptoSymbol,
      toCurrency: 'USD',
      fromAmount: amount,
      toAmount: netUsd,
      exchangeRate: cryptoPrice,
      fee: conversionFee,
      reference,
      description: `Sold ${amount.toFixed(8)} ${cryptoSymbol} for $${netUsd.toFixed(2)}`,
      metadata: {
        toAccount,
        direction: 'sell',
        grossUsd,
      }
    });

    // Send email notification
    try {
      await sendTransactionEmail(user.email, {
        name: user.name || 'Customer',
        transaction: {
          type: 'Crypto Sale',
          amount: netUsd,
          description: `Sold ${amount.toFixed(8)} ${cryptoSymbol} → $${netUsd.toFixed(2)} credited to ${toAccount}`,
          reference,
          status: 'Completed',
        },
        subject: 'Crypto Sale Completed'
      });
    } catch (emailError) {
      console.error('[Crypto Sell] Email failed:', emailError);
    }

    // Get updated balances
    const updatedUser = await User.findById(user._id);

    return NextResponse.json({
      success: true,
      message: `Successfully sold ${amount.toFixed(8)} ${cryptoSymbol} for $${netUsd.toFixed(2)}`,
      reference,
      sale: {
        fromCurrency: cryptoSymbol,
        fromAmount: amount,
        toCurrency: 'USD',
        toAmount: netUsd,
        exchangeRate: cryptoPrice,
        fee: conversionFee,
        grossUsd,
        toAccount,
        status: 'completed',
        date: new Date().toISOString(),
      },
      balances: {
        checking: updatedUser?.checkingBalance || 0,
        savings: updatedUser?.savingsBalance || 0,
        investment: updatedUser?.investmentBalance || 0,
      },
    });

  } catch (error: any) {
    console.error('[Crypto Sell] Error:', error);
    return NextResponse.json({ success: false, error: 'Sale failed' }, { status: 500 });
  }
}
