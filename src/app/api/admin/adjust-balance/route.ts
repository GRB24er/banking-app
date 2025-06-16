import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import transporter from '@/lib/mail';
import { OWNER_EMAIL } from '@/lib/constants';

type Action = 'credit' | 'debit';
type Currency = 'USD' | 'BTC';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const normalizedOwnerEmail = OWNER_EMAIL.trim().toLowerCase();
    const normalizedUserEmail = session.user.email.trim().toLowerCase();

    if (normalizedUserEmail !== normalizedOwnerEmail) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { userEmail, amount, currency, action } = await request.json();

    if (!userEmail || !amount || amount <= 0 || !currency || !action) {
      return NextResponse.json({ message: 'Missing or invalid fields' }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    let newBalance: number;
    let txnType: string;
    let description: string;

    if (currency === 'USD') {
      if (action === 'credit') {
        user.balance += amount;
        txnType = 'deposit';
        description = Owner credited $${amount.toFixed(2)};
      } else {
        if (user.balance < amount) {
          return NextResponse.json({ message: 'Insufficient USD balance' }, { status: 400 });
        }
        user.balance -= amount;
        txnType = 'withdrawal';
        description = Owner debited $${amount.toFixed(2)};
      }
      newBalance = user.balance;
    } else {
      if (action === 'credit') {
        user.btcBalance += amount;
        txnType = 'transfer_btc';
        description = Owner credited ${amount.toFixed(6)} BTC;
      } else {
        if (user.btcBalance < amount) {
          return NextResponse.json({ message: 'Insufficient BTC balance' }, { status: 400 });
        }
        user.btcBalance -= amount;
        txnType = 'withdrawal';
        description = Owner debited ${amount.toFixed(6)} BTC;
      }
      newBalance = user.btcBalance;
    }

    await user.save();

    await Transaction.create({
      userId: user._id,
      type: txnType,
      currency,
      amount: action === 'debit' ? -amount : amount,
      description,
    });

    const mailOptions = {
      from: 'Horizon Global Capital <admin@horizonglobalcapital.com>',
      to: userEmail,
      subject: Your account was ${action === 'credit' ? 'credited' : 'debited'},
      html: 
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Hello ${user.name},</h2>
          <p>The site owner has ${action === 'credit' ? 'added' : 'removed'} funds ${
        currency === 'USD' ? 'USD' : 'BTC'
      } from your account.</p>
          <p><strong>Details:</strong></p>
          <ul>
            <li><strong>Type:</strong> ${
              currency === 'USD'
                ? action === 'credit'
                  ? 'Credit (USD)'
                  : 'Debit (USD)'
                : action === 'credit'
                ? 'Credit (BTC)'
                : 'Debit (BTC)'
            }</li>
            <li><strong>Amount:</strong> ${
              currency === 'USD' ? $${amount.toFixed(2)} : ${amount.toFixed(6)} BTC
            }</li>
            <li><strong>New ${currency} Balance:</strong> ${
        currency === 'USD' ? $${newBalance.toFixed(2)} : ${newBalance.toFixed(6)} BTC
      }</li>
          </ul>
          <p>If you have any questions, please reply to this email or contact support.</p>
          <br/>
          <p>Regards,<br/>Horizon Global Capital Team</p>
        </div>
      ,
    };

    transporter.sendMail(mailOptions, (err: Error | null) => {
      if (err) console.error('Error sending email:', err);
    });

    return NextResponse.json({ success: true, newBalance }, { status: 200 });
  } catch (error: any) {
    console.error('Error in /api/admin/adjust-balance:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}          