// Admin Crypto Withdraw - Debit crypto from client's wallet
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

    // Check if user is admin
    const adminUser = await User.findOne({ email: session.user.email });
    if (!adminUser?.isAdmin && (adminUser as any)?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { userId, cryptoCurrency, amount, description } = await request.json();

    if (!userId || !cryptoCurrency || !amount) {
      return NextResponse.json({ success: false, error: 'userId, cryptoCurrency, and amount are required' }, { status: 400 });
    }

    const withdrawAmount = Math.abs(Number(amount));
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 });
    }

    const cryptoSymbol = cryptoCurrency.toUpperCase();

    // Get user and wallet
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const wallet = await CryptoWallet.findOne({ userId: user._id });
    if (!wallet) {
      return NextResponse.json({ success: false, error: 'User has no crypto wallet' }, { status: 404 });
    }

    const balanceIndex = wallet.balances.findIndex((b: any) => b.symbol === cryptoSymbol);
    if (balanceIndex < 0) {
      return NextResponse.json({ success: false, error: `User has no ${cryptoSymbol} balance` }, { status: 400 });
    }

    const available = wallet.balances[balanceIndex].balance - (wallet.balances[balanceIndex].lockedBalance || 0);
    if (withdrawAmount > available) {
      return NextResponse.json({
        success: false,
        error: `Insufficient ${cryptoSymbol} balance. Available: ${available}`,
        available,
      }, { status: 400 });
    }

    // Get USD value
    let usdValue = 0;
    try {
      const price = await getCryptoPrice(cryptoSymbol);
      usdValue = withdrawAmount * price;
    } catch (e) {
      // Price fetch optional
    }

    // Generate reference
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const reference = `CWTH-${timestamp}-${random}`;

    // Deduct from wallet
    wallet.balances[balanceIndex].balance -= withdrawAmount;
    await wallet.save();

    // Create transaction record
    const transaction = await CryptoTransaction.create({
      userId: user._id,
      type: 'send',
      status: 'completed',
      cryptoCurrency: cryptoSymbol,
      cryptoAmount: withdrawAmount,
      fee: 0,
      reference,
      description: description || `${cryptoSymbol} withdrawal`,
      approvedBy: adminUser._id,
      approvedAt: new Date(),
      metadata: {
        usdValue,
        channel: 'admin',
        origin: 'admin_withdrawal',
      }
    });

    // Send email notification
    try {
      await sendTransactionEmail(user.email, {
        name: user.name || 'Customer',
        transaction: {
          type: 'Crypto Withdrawal',
          amount: withdrawAmount,
          currency: cryptoSymbol,
          description: description || `${cryptoSymbol} withdrawal`,
          reference,
          status: 'Completed',
        },
        subject: 'Crypto Withdrawal Processed'
      });
    } catch (emailError) {
      console.error('[Admin Crypto Withdraw] Email failed:', emailError);
    }

    // Get updated wallet
    const updatedWallet = await CryptoWallet.findOne({ userId: user._id });

    return NextResponse.json({
      success: true,
      message: `Successfully withdrew ${withdrawAmount} ${cryptoSymbol} from user's wallet`,
      reference,
      withdrawal: {
        cryptoCurrency: cryptoSymbol,
        amount: withdrawAmount,
        usdValue,
        status: 'completed',
      },
      updatedBalance: updatedWallet?.balances.find((b: any) => b.symbol === cryptoSymbol)?.balance || 0,
    });

  } catch (error: any) {
    console.error('[Admin Crypto Withdraw] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process withdrawal' }, { status: 500 });
  }
}
