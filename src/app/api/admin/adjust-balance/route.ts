import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import transporter from '@/lib/mail';
import { OWNER_EMAIL } from '@/lib/constants';

type Action = 'credit' | 'debit';
type Currency = 'USD' | 'BTC';

export async function POST(request: NextRequest) {
  try {
    // 1) Authorization check
    const session = await getServerSession(authOptions);
    
    // Check session exists and has valid email
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Case-insensitive comparison
    const normalizedOwnerEmail = OWNER_EMAIL.trim().toLowerCase();
    const normalizedUserEmail = session.user.email.trim().toLowerCase();

    if (normalizedUserEmail !== normalizedOwnerEmail) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // 2) Parse request body
    const { userEmail, amount, currency, action } = await request.json();

    if (!userEmail || !amount || amount <= 0 || !currency || !action) {
      return NextResponse.json({ message: 'Missing or invalid fields' }, { status: 400 });
    }

    // 3) Connect to MongoDB and find the target user
    await dbConnect();
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // 4) Adjust the appropriate balance
    let newBalance: number;
    let txnType: string;
    let description: string;

    if (currency === 'USD') {
      if (action === 'credit') {
        user.balance += amount;
        txnType = 'deposit';
        description = `Owner credited $${amount.toFixed(2)}`;
      } else {
        if (user.balance < amount) {
          return NextResponse.json({ message: 'Insufficient USD balance' }, { status: 400 });
        }
        user.balance -= amount;
        txnType = 'withdrawal';
        description = `Owner debited $${amount.toFixed(2)}`;
      }
      newBalance = user.balance;
    } else {
      // BTC
      if (action === 'credit') {
        user.btcBalance += amount;
        txnType = 'transfer_btc';
        description = `Owner credited ${amount.toFixed(6)} BTC`;
      } else {
        if (user.btcBalance < amount) {
          return NextResponse.json({ message: 'Insufficient BTC balance' }, { status: 400 });
        }
        user.btcBalance -= amount;
        txnType = 'withdrawal';
        description = `Owner debited ${amount.toFixed(6)} BTC`;
      }
      newBalance = user.btcBalance;
    }

    // 5) Save user
    await user.save();

    // 6) Log a transaction record
    await Transaction.create({
      userId: user._id,
      type: txnType,
      currency,
      amount: action === 'debit' ? -amount : amount,
      description,
    });

    // 7) Send notification email to the user
    const mailOptions = {
      from: 'Horizon Global Capital <admin@horizonglobalcapital.com>',
      to: userEmail,
      subject: `Your account was ${action === 'credit' ? 'credited' : 'debited'}`,
      html: `
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
              currency === 'USD' ? `$${amount.toFixed(2)}` : `${amount.toFixed(6)} BTC`
            }</li>
            <li><strong>New ${
              currency === 'USD' ? 'USD' : 'BTC'
            } Balance:</strong> ${
        currency === 'USD'
          ? `$${newBalance.toFixed(2)}`
          : `${newBalance.toFixed(6)} BTC`
      }</li>
          </ul>
          <p>If you have any questions, please reply to this email or contact support.</p>
          <br/>
          <p>Regards,<br/>Horizon Global Capital Team</p>
        </div>
      `,
    };
    
    // Don't wait for email to send response
    transporter.sendMail(mailOptions, (err: Error | null) => {
      if (err) console.error('Error sending email:', err);
    });

    // 8) Return success + new balance
    return NextResponse.json({ success: true, newBalance }, { status: 200 });
  } catch (error: any) {
    console.error('Error in /api/admin/adjust-balance:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}