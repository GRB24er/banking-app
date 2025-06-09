// File: src/app/api/auth/register/route.ts

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/User';
import bcrypt from 'bcryptjs';
import { generateAccountNumber, generateRoutingNumber, generateBitcoinAddress } from '../../../../lib/generators';
import transporter from '../../../../lib/mail';

export async function POST(request: NextRequest) {
  try {
    // 1) Parse name, email, password from the request body
    const { name, email, password } = await request.json();
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Missing required fields (name, email, password)' },
        { status: 400 }
      );
    }

    // 2) Connect to MongoDB
    await dbConnect();

    // 3) Check if a user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: 'A user with that email already exists' },
        { status: 409 }
      );
    }

    // 4) Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5) Generate the new accountNumber, routingNumber, bitcoinAddress
    const accountNumber = generateAccountNumber();     // e.g. "8392014721"
    const routingNumber = generateRoutingNumber();     // e.g. "021000021"
    const bitcoinAddress = generateBitcoinAddress();   // e.g. "1A..." (34 chars)

    // 6) Create the new user document
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

    // 7) Send the welcome email (using hard‐coded SMTP credentials from lib/mail.ts)
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

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('Error sending signup email:', err);
      } else {
        console.log('Signup email sent:', info.response);
      }
    });

    // 8) Return a success response
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
