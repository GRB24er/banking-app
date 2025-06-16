import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { transporter } from '@/lib/mail';

export async function POST(request: NextRequest) {
  await dbConnect();

  try {
    const { userId, type, amount, description, relatedUserId } =
      await request.json();

    if (!userId || !type || !amount || amount <= 0) {
      return NextResponse.json(
        { message: 'Invalid input parameters' },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    let newBalance = user.balance;

    if (['withdrawal', 'debit', 'transfer'].includes(type)) {
      if (user.balance < amount) {
        return NextResponse.json(
          { message: 'Insufficient funds' },
          { status: 400 }
        );
      }
      newBalance -= amount;
    } else if (['deposit', 'credit'].includes(type)) {
      newBalance += amount;
    }

    const transaction = {
      type,
      amount,
      description,
      date: new Date(),
      balanceAfter: newBalance,
      relatedUser: relatedUserId || null,
    };

    user.balance = newBalance;
    user.transactions.push(transaction);
    await user.save();

    await sendTransactionEmail(user.email, user, transaction);

    if (type === 'transfer' && relatedUserId) {
      const recipient = await User.findById(relatedUserId);
      if (recipient) {
        const recipientTransaction = {
          type: 'credit',
          amount,
          description: `Transfer from ${user.name}: ${description}`,
          date: new Date(),
          balanceAfter: recipient.balance + amount,
          relatedUser: userId,
        };

        recipient.balance += amount;
        recipient.transactions.push(recipientTransaction);
        await recipient.save();

        await sendTransactionEmail(
          recipient.email,
          recipient,
          recipientTransaction
        );
      }
    }

    return NextResponse.json({ success: true, newBalance, transaction });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Transaction failed' },
      { status: 500 }
    );
  }
}
