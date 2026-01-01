// src/app/api/admin/transfers/attach-code/route.ts
// Admin attaches verification code (Rewarble code) to a pending transfer

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import { sendSimpleEmail } from "@/lib/mail";

export async function POST(request: NextRequest) {
  try {
    console.log('[Admin] Attaching verification code');
    
    const session = await getServerSession(authOptions);
    
    // Check admin role
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const adminUser = await User.findOne({ email: session.user.email });
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    const { transactionId, verificationCode, adminNotes } = await request.json();

    if (!transactionId || !verificationCode) {
      return NextResponse.json(
        { success: false, error: "Missing transaction ID or verification code" },
        { status: 400 }
      );
    }

    // Clean the verification code
    const cleanCode = verificationCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    
    if (cleanCode.length !== 16) {
      return NextResponse.json(
        { success: false, error: "Verification code must be 16 characters" },
        { status: 400 }
      );
    }

    // Find the transaction
    const transaction = await Transaction.findById(transactionId);
    
    if (!transaction) {
      return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 404 });
    }

    // Get the user for email notification
    const user = await User.findById(transaction.userId);
    
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Update transaction with verification code
    transaction.metadata = {
      ...transaction.metadata,
      verificationCode: cleanCode,
      verificationRequired: true,
      verificationUrl: "https://rewarble.com/redeem",
      codeAttachedBy: adminUser._id,
      codeAttachedAt: new Date(),
      adminNotes: adminNotes || ''
    };
    
    await transaction.save();

    console.log('[Admin] Verification code attached:', {
      transactionId,
      reference: transaction.reference,
      codeLastFour: cleanCode.slice(-4)
    });

    // Format code with dashes for display
    const formattedCode = cleanCode.match(/.{1,4}/g)?.join('-') || cleanCode;

    // Send email to user notifying them verification is ready
    try {
      const subject = '🔐 Transfer Verification Required - Action Needed';
      
      const textContent = `
Hello ${user.name || 'Customer'},

Your transfer requires verification to release the funds.

YOUR SECURITY VERIFICATION CODE:
${formattedCode}

TRANSFER DETAILS:
Reference: ${transaction.reference}
Amount: $${transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
Status: Pending Verification

HOW TO COMPLETE VERIFICATION:
1. Log in to your ZentriBank account
2. Go to your pending transfer or click the link below
3. Enter the verification code above
4. Complete the identity verification on the secure portal
5. Your funds will be released to the recipient

Complete Verification: ${process.env.NEXTAUTH_URL || 'https://zentribank.capital'}/send-money

⚠️ IMPORTANT:
- Do not share this code with anyone
- ZentriBank will never ask for your verification code over the phone
- Do not use VPN during verification

If you did not initiate this transfer, please contact support immediately.

ZentriBank Capital
      `.trim();

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Transfer Verification Required</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 40px 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 700;">🔐 Transfer Verification Required</h1>
      <p style="margin: 10px 0 0; opacity: 0.9;">Action Required to Release Funds</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 30px;">
      
      <!-- Alert Box -->
      <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
        <h2 style="color: #92400e; margin: 0 0 10px; font-size: 18px;">⚠️ Action Required</h2>
        <p style="margin: 0; color: #92400e;">Your transfer requires verification to release the funds. Please complete the verification process using the code below.</p>
      </div>
      
      <!-- Code Box -->
      <div style="background: #f0fdf4; border: 2px solid #10b981; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
        <p style="margin: 0 0 10px; color: #64748b; font-size: 14px;">Your Security Verification Code</p>
        <div style="font-family: 'Courier New', Monaco, monospace; font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #059669;">
          ${formattedCode}
        </div>
      </div>
      
      <!-- Instructions -->
      <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="margin: 0 0 15px; color: #0f172a; font-size: 16px;">How to Complete Verification</h3>
        <ol style="margin: 0; padding-left: 20px; color: #475569;">
          <li style="margin-bottom: 10px;">Log in to your ZentriBank account</li>
          <li style="margin-bottom: 10px;">Go to your pending transfer</li>
          <li style="margin-bottom: 10px;">Enter the verification code above</li>
          <li style="margin-bottom: 10px;">Complete the identity verification on the secure portal</li>
          <li style="margin-bottom: 10px;">Your funds will be released to the recipient</li>
        </ol>
      </div>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXTAUTH_URL || 'https://zentribank.capital'}/send-money" 
           style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 15px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
          Complete Verification →
        </a>
      </div>
      
      <!-- Transfer Summary -->
      <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
        <h3 style="margin: 0 0 15px; color: #0f172a; font-size: 16px;">Transfer Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Reference:</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #0f172a;">${transaction.reference}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Amount:</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #0f172a;">$${transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Status:</td>
            <td style="padding: 8px 0; text-align: right;">
              <span style="background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Pending Verification</span>
            </td>
          </tr>
        </table>
      </div>
      
      <!-- Warning -->
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin-top: 25px;">
        <p style="margin: 0; color: #dc2626; font-size: 13px;">
          <strong>⚠️ Security Warning:</strong> Do not share this code with anyone. ZentriBank will never ask for your verification code over the phone. Do not use VPN during verification.
        </p>
      </div>
      
    </div>
    
    <!-- Footer -->
    <div style="background: #f8fafc; padding: 20px 30px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
      <p style="margin: 5px 0;"><strong>ZentriBank Capital</strong></p>
      <p style="margin: 5px 0;">If you did not initiate this transfer, please contact support immediately.</p>
      <p style="margin: 5px 0;">© ${new Date().getFullYear()} ZentriBank Capital. All rights reserved.</p>
    </div>
    
  </div>
</body>
</html>
      `;

      const emailResult = await sendSimpleEmail(
        user.email,
        subject,
        textContent,
        htmlContent
      );
      
      console.log('[Admin] Verification email sent to user:', emailResult?.messageId);
    } catch (emailError) {
      console.error('[Admin] Email failed:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: "Verification code attached and user notified via email",
      transaction: {
        _id: transaction._id,
        reference: transaction.reference,
        status: transaction.status,
        verificationRequired: true
      }
    });

  } catch (error: any) {
    console.error('[Admin] Attach code error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to attach verification code" },
      { status: 500 }
    );
  }
}