import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/User';
import bcrypt from 'bcryptjs';
import { generateAccountNumber, generateRoutingNumber, generateBitcoinAddress } from '../../../../lib/generators';
import transporter from '@/lib/mail'; // ✅ Corrected import
import { SentMessageInfo } from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Missing required fields (name, email, password)' },
        { status: 400 }
      );
    }

    await dbConnect();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: 'A user with that email already exists' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const accountNumber = generateAccountNumber();
    const routingNumber = generateRoutingNumber();
    const bitcoinAddress = generateBitcoinAddress();

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'user',
      balance: 0,
      accountNumber,
      routingNumber,
      bitcoinAddress,
    });

    const mailOptions = {
      from: 'Horizon Global Capital <admin@horizonglobalcapital.com>',
      to: email,
      subject: 'Welcome to Horizon Global Capital – Your Account Details',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Welcome, ${name}!</h2>
          <p>Thank you for signing up at <strong>Horizon Global Capital</strong>. Below are your new account details:</p>
          
          <h3>Checking Account</h3>
          <ul>
            <li><strong>Account Number:</strong> ${accountNumber}</li>
            <li><strong>Routing Number:</strong> ${routingNumber}</li>
          </ul>

          <h3>Bitcoin Wallet</h3>
          <ul>
            <li><strong>BTC Address:</strong> ${bitcoinAddress}</li>
          </ul>

          <p>Your login email is <strong>${email}</strong>. Keep these details safe. If you have any questions, reply to this email or visit our support page.</p>

          <br/>
          <p>Regards,<br/>Horizon Global Capital Team</p>
        </div>
      `,
    };

    transporter.sendMail(mailOptions, (err: Error | null, info: SentMessageInfo) => {
      if (err) {
        console.error('Error sending signup email:', err);
      } else {
        console.log('Signup email sent:', info.response);
      }
    });

    return NextResponse.json(
      { message: 'User created successfully', userId: newUser._id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in /api/auth/register:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
