// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect, { db } from '@/lib/mongodb';
import User from '@/models/User';
import { generateAccountNumber, generateRoutingNumber, generateBitcoinAddress } from '@/lib/generators';
import { transporter, sendWelcomeEmail } from '@/lib/mail';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();
    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    if (await User.findOne({ email })) {
      return NextResponse.json({ message: 'Email already registered' }, { status: 409 });
    }

    const accountNumber   = generateAccountNumber();
    const routingNumber   = generateRoutingNumber();
    const bitcoinAddress  = generateBitcoinAddress();

    const newUser = await User.create({
      name, email, password,
      role: 'user', verified: false,
      balance: 0, btcBalance: 0,
      accountNumber, routingNumber, bitcoinAddress
    });

    const initTxn = {
      type:        'deposit' as const,
      amount:      0,
      description: 'Account created',
      date:        new Date(),
      balanceAfter: 0,
      status:      'Completed' as const,
      reference:   generateAccountNumber().replace(/./g, 'txn') + Date.now()
    };
    newUser.transactions.push(initTxn);
    await newUser.save();

    // 1) Raw account-details email with improved professional template
    await transporter.sendMail({
      from:    'Horizon Global Capital <admin@horizonglobalcapital.com>',
      to:      email,
      subject: 'Your Account Details',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <title>Welcome to Horizon Global Capital</title>
          </head>
          <body style="margin: 0; padding: 0; background: #f5f7fa; font-family: 'Segoe UI', Tahoma, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 0;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
                    <tr>
                      <td style="background: #002b5c; padding: 20px; color: white; text-align: center; font-size: 24px; font-weight: bold;">
                        Horizon Global Capital
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 30px; color: #333333;">
                        <h2 style="margin-top: 0;">Welcome, ${name}!</h2>
                        <p style="font-size: 16px;">We’re excited to have you on board. Below are your new account credentials:</p>

                        <table cellpadding="12" cellspacing="0" style="width: 100%; background: #f9f9f9; border-radius: 6px; margin: 20px 0;">
                          <tr>
                            <td style="font-weight: bold; width: 40%;">Account Number</td>
                            <td>${accountNumber}</td>
                          </tr>
                          <tr style="background: #f1f1f1;">
                            <td style="font-weight: bold;">Routing Number</td>
                            <td>${routingNumber}</td>
                          </tr>
                          <tr>
                            <td style="font-weight: bold;">Bitcoin Address</td>
                            <td style="word-break: break-all;">${bitcoinAddress}</td>
                          </tr>
                        </table>

                        <p>🔒 <strong>Important:</strong> Never share these details. For full security features, please visit your dashboard.</p>

                        <div style="text-align: center; margin: 30px 0;">
                          <a href="https://horizonglobalcapital.com/dashboard" style="background: #002b5c; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold;">
                            Go to Dashboard
                          </a>
                        </div>

                        <p style="font-size: 14px; color: #555;">If you didn’t create this account, please contact support immediately.</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background: #eeeeee; text-align: center; padding: 15px; font-size: 12px; color: #666;">
                        &copy; ${new Date().getFullYear()} Horizon Global Capital. All rights reserved.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `
    });

    // 2) Branded welcome & summary email
    await sendWelcomeEmail(email, {
      name:           newUser.name,
      balance:        newUser.balance,
      bitcoinBalance: newUser.btcBalance,
      accountStatus:  newUser.verified ? 'Verified' : 'Unverified',
      transactions: [
        {
          type:        initTxn.type,
          date:        initTxn.date.toLocaleString('en-US', { month:'long',day:'numeric',year:'numeric',hour:'numeric',minute:'numeric',hour12:true }),
          description: initTxn.description,
          amount:      initTxn.amount,
          balanceAfter:initTxn.balanceAfter,
          status:      initTxn.status,
          reference:   initTxn.reference
        }
      ],
      nextSteps: ['Verify your email','Set up mobile banking','Add beneficiary']
    });

    return NextResponse.json({ message: 'User created', userId: newUser._id }, { status: 201 });
  } catch (err: any) {
    console.error('Error in /api/auth/register:', err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
