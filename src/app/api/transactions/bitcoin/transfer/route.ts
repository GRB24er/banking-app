import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { amount, bitcoinAddress, description } = await request.json();
    const numericAmount = Number(amount);
    
    if (isNaN(numericAmount) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const sender = await db.getUserByEmail(session.user.email);
    if (!sender) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const recipient = await User.findOne({ bitcoinAddress });
    if (!recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    }

    // Perform transfer (atomic operation)
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Deduct from sender
      await db.updateBitcoinBalance(
        sender._id.toString(),
        -numericAmount,
        {
          type: 'transfer',
          description: description || `Transfer to ${bitcoinAddress}`,
          relatedUser: recipient._id
        }
      );

      // Add to recipient
      await db.updateBitcoinBalance(
        recipient._id.toString(),
        numericAmount,
        {
          type: 'transfer',
          description: description || `Transfer from ${sender.bitcoinAddress}`,
          relatedUser: sender._id
        }
      );

      await session.commitTransaction();
      return NextResponse.json({ success: true });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Transfer failed' },
      { status: 500 }
    );
  }
}