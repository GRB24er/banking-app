// Admin - List all user crypto wallets
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import CryptoWallet from '@/models/CryptoWallet';
import { getCryptoPrice } from '@/lib/cryptoPrices';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    // Get all wallets with user info
    const wallets = await CryptoWallet.find({}).lean();

    // Get all user IDs from wallets
    const userIds = wallets.map((w: any) => w.userId);
    const users = await User.find({ _id: { $in: userIds } }).select('name email').lean();

    const userMap = new Map(users.map((u: any) => [u._id.toString(), u]));

    // Build result with user info
    const result = await Promise.all(wallets.map(async (wallet: any) => {
      const user = userMap.get(wallet.userId.toString());

      // Calculate total USD value
      let totalUsdValue = 0;
      const balancesWithPrices = await Promise.all(
        (wallet.balances || []).filter((b: any) => b.balance > 0).map(async (b: any) => {
          let price = 0;
          try {
            price = await getCryptoPrice(b.symbol);
          } catch (e) {}
          const usdValue = b.balance * price;
          totalUsdValue += usdValue;
          return {
            symbol: b.symbol,
            currency: b.currency || b.symbol,
            balance: b.balance,
            lockedBalance: b.lockedBalance || 0,
            available: b.balance - (b.lockedBalance || 0),
            usdValue,
            price,
          };
        })
      );

      return {
        walletId: wallet._id,
        userId: wallet.userId,
        userName: user?.name || 'Unknown',
        userEmail: user?.email || 'Unknown',
        balances: balancesWithPrices,
        totalUsdValue,
      };
    }));

    // Filter out wallets with no balances
    const activeWallets = result.filter(w => w.balances.length > 0);

    return NextResponse.json({
      success: true,
      wallets: activeWallets,
      total: activeWallets.length,
    });

  } catch (error: any) {
    console.error('[Admin Crypto Wallets] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch wallets' }, { status: 500 });
  }
}
