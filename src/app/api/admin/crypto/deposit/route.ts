// Admin Crypto Deposit - Credit crypto to client's wallet
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import CryptoWallet from '@/models/CryptoWallet';
import CryptoTransaction from '@/models/CryptoTransaction';
import { getCryptoPrice } from '@/lib/cryptoPrices';
import { sendTransactionEmail } from '@/lib/mail';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const adminUser = await User.findOne({ email: session.user.email });
    if (!adminUser?.isAdmin && (adminUser as any)?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { userId, cryptoCurrency, amount, description } = await request.json();

    if (!userId || !cryptoCurrency || !amount) {
      return NextResponse.json({ success: false, error: 'userId, cryptoCurrency, and amount are required' }, { status: 400 });
    }

    const depositAmount = Math.abs(Number(amount));
    if (isNaN(depositAmount) || depositAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 });
    }

    const cryptoSymbol = cryptoCurrency.toUpperCase();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Get or create wallet
    let wallet = await CryptoWallet.findOne({ userId: user._id });
    if (!wallet) {
      wallet = await CryptoWallet.create({ userId: user._id });
    }

    // Get USD value
    let usdValue = 0;
    try {
      const price = await getCryptoPrice(cryptoSymbol);
      usdValue = depositAmount * price;
    } catch (e) {}

    // Generate reference
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const reference = `CDEP-${timestamp}-${random}`;

    // Add to wallet
    const balanceIndex = wallet.balances.findIndex((b: any) => b.symbol === cryptoSymbol);
    if (balanceIndex >= 0) {
      wallet.balances[balanceIndex].balance += depositAmount;
    } else {
      wallet.balances.push({
        currency: cryptoSymbol,
        symbol: cryptoSymbol,
        balance: depositAmount,
        lockedBalance: 0,
      });
    }
    await wallet.save();

    // Create transaction record
    await CryptoTransaction.create({
      userId: user._id,
      type: 'receive',
      status: 'completed',
      cryptoCurrency: cryptoSymbol,
      cryptoAmount: depositAmount,
      fee: 0,
      reference,
      description: description || `${cryptoSymbol} deposit`,
      approvedBy: adminUser._id,
      approvedAt: new Date(),
      metadata: {
        usdValue,
        channel: 'admin',
        origin: 'admin_deposit',
      }
    });

    // Send email
    try {
      await sendTransactionEmail(user.email, {
        name: user.name || 'Customer',
        transaction: {
          type: 'Crypto Deposit',
          amount: depositAmount,
          currency: cryptoSymbol,
          description: description || `${cryptoSymbol} deposit`,
          reference,
          status: 'Completed',
        },
        subject: 'Crypto Deposit Received'
      });
    } catch (emailError) {
      console.error('[Admin Crypto Deposit] Email failed:', emailError);
    }

    const updatedWallet = await CryptoWallet.findOne({ userId: user._id });

    return NextResponse.json({
      success: true,
      message: `Successfully deposited ${depositAmount} ${cryptoSymbol} to user's wallet`,
      reference,
      deposit: {
        cryptoCurrency: cryptoSymbol,
        amount: depositAmount,
        usdValue,
        status: 'completed',
      },
      updatedBalance: updatedWallet?.balances.find((b: any) => b.symbol === cryptoSymbol)?.balance || 0,
    });

  } catch (error: any) {
    console.error('[Admin Crypto Deposit] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process deposit' }, { status: 500 });
  }
}
