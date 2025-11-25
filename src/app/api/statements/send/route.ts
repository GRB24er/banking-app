// src/app/api/statements/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Statement from '@/models/Statement';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import nodemailer from 'nodemailer';

const authOptions = {
  secret: 'b3bc4dcf9055e490cef86fd9647fc8acd61d6bbe07dfb85fb6848bfe7f4f3926',
};

const ADMIN_EMAILS = ['admin@horizonbank.com', 'your-email@example.com'];

export async function POST(req: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const isAdmin = user.role === 'admin' || ADMIN_EMAILS.includes(session.user.email.toLowerCase());

    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const { requestId } = await req.json();

    if (!requestId) {
      return NextResponse.json({ success: false, error: 'Request ID is required' }, { status: 400 });
    }

    const statement: any = await Statement.findById(requestId).populate('userId', 'name email');

    if (!statement) {
      return NextResponse.json({ success: false, error: 'Statement not found' }, { status: 404 });
    }

    if (statement.status === 'sent') {
      return NextResponse.json({ success: false, error: 'Statement already sent' }, { status: 400 });
    }

    // Get transactions for the date range
    const transactions = await Transaction.find({
      userId: statement.userId._id,
      date: {
        $gte: statement.startDate,
        $lte: statement.endDate
      }
    }).sort({ date: 1 });

    // Calculate totals and balances
    const deposits = transactions
      .filter((t: any) => t.type === 'credit')
      .reduce((sum: number, t: any) => sum + t.amount, 0);
    
    const withdrawals = transactions
      .filter((t: any) => t.type === 'debit')
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    // Get opening balance (simplified - you may want to calculate from actual balance)
    const openingBalance = 5000; // You should calculate this from your actual data
    const closingBalance = openingBalance + deposits - withdrawals;

    // Statement number generation
    const statementNumber = `ZB-${new Date().getFullYear()}-${String(Date.now()).slice(-8)}`;

    // Create professional banking statement HTML
    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Helvetica Neue', Arial, sans-serif; 
            line-height: 1.6; 
            color: #1e293b;
            background: #f8f9fa;
            padding: 20px;
          }
          .statement-container { 
            max-width: 850px; 
            margin: 0 auto; 
            background: white;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          }
          
          /* Letterhead */
          .letterhead {
            background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
            color: white;
            padding: 40px;
            position: relative;
          }
          .letterhead::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #d4af37, #f4d03f, #d4af37);
          }
          .bank-logo {
            width: 180px;
            margin-bottom: 20px;
          }
          .bank-info {
            font-size: 12px;
            line-height: 1.8;
            opacity: 0.95;
          }
          .bank-info strong {
            display: block;
            font-size: 16px;
            margin-bottom: 8px;
            font-weight: 600;
            letter-spacing: 1px;
          }
          
          /* Statement Header */
          .statement-header {
            padding: 40px;
            border-bottom: 3px solid #e5e7eb;
          }
          .statement-title {
            font-size: 28px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
          }
          .statement-subtitle {
            color: #64748b;
            font-size: 14px;
            margin-bottom: 24px;
          }
          .statement-meta {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 24px;
          }
          .meta-group {
            background: #f8fafc;
            padding: 16px;
            border-radius: 8px;
            border-left: 4px solid #2563eb;
          }
          .meta-label {
            font-size: 11px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          .meta-value {
            font-size: 15px;
            font-weight: 600;
            color: #1e293b;
          }
          
          /* Account Summary */
          .account-summary {
            padding: 40px;
            background: #f8fafc;
            border-bottom: 1px solid #e5e7eb;
          }
          .summary-title {
            font-size: 18px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 2px solid #cbd5e1;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
          }
          .summary-item {
            background: white;
            padding: 20px;
            border-radius: 10px;
            border: 1px solid #e5e7eb;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          }
          .summary-item-label {
            font-size: 12px;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
          }
          .summary-item-value {
            font-size: 24px;
            font-weight: 700;
            color: #1e293b;
          }
          .summary-item-value.credit { color: #10b981; }
          .summary-item-value.debit { color: #ef4444; }
          .summary-item-value.balance { color: #2563eb; }
          
          /* Transactions Table */
          .transactions-section {
            padding: 40px;
          }
          .transactions-title {
            font-size: 18px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 2px solid #cbd5e1;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
          }
          thead {
            background: #1e293b;
            color: white;
          }
          th {
            padding: 14px 12px;
            text-align: left;
            font-weight: 700;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          tbody tr {
            border-bottom: 1px solid #f1f5f9;
          }
          tbody tr:hover {
            background: #f8fafc;
          }
          td {
            padding: 14px 12px;
            font-size: 13px;
          }
          .date-col { 
            color: #64748b; 
            font-weight: 600;
            width: 100px;
          }
          .desc-col { 
            color: #1e293b;
            font-weight: 500;
          }
          .type-col {
            width: 100px;
          }
          .type-badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .type-credit {
            background: #d1fae5;
            color: #065f46;
          }
          .type-debit {
            background: #fee2e2;
            color: #991b1b;
          }
          .amount-col {
            text-align: right;
            font-weight: 700;
            font-family: 'Courier New', monospace;
            width: 120px;
          }
          .amount-credit { color: #10b981; }
          .amount-debit { color: #ef4444; }
          .balance-col {
            text-align: right;
            font-weight: 600;
            font-family: 'Courier New', monospace;
            color: #2563eb;
            width: 120px;
          }
          
          /* Footer */
          .statement-footer {
            padding: 40px;
            background: #1e293b;
            color: white;
          }
          .footer-important {
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #d4af37;
          }
          .footer-important-title {
            font-size: 14px;
            font-weight: 700;
            margin-bottom: 8px;
            color: #d4af37;
          }
          .footer-important-text {
            font-size: 12px;
            line-height: 1.8;
            opacity: 0.9;
          }
          .footer-contact {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid rgba(255,255,255,0.2);
          }
          .contact-item {
            font-size: 12px;
            opacity: 0.9;
          }
          .contact-label {
            font-weight: 700;
            margin-bottom: 4px;
            color: #d4af37;
          }
          .footer-legal {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid rgba(255,255,255,0.2);
            font-size: 11px;
            opacity: 0.7;
            text-align: center;
            line-height: 1.8;
          }
          
          /* No transactions message */
          .no-transactions {
            text-align: center;
            padding: 60px 40px;
            color: #64748b;
          }
          .no-transactions-icon {
            font-size: 48px;
            margin-bottom: 16px;
            opacity: 0.3;
          }
        </style>
      </head>
      <body>
        <div class="statement-container">
          <!-- Letterhead -->
          <div class="letterhead">
            <img src="https://i.ibb.co/ymwC7HBZ/zentri-bank-logo.png" alt="ZentriBank" class="bank-logo" style="filter: brightness(0) invert(1);">
            <div class="bank-info">
              <strong>ZENTRIBANK</strong>
              123 Financial District, Suite 500<br>
              New York, NY 10004, United States<br>
              Tel: +1 (800) 123-4567 | Fax: +1 (800) 123-4568<br>
              www.zentribank.com | support@zentribank.com
            </div>
          </div>
          
          <!-- Statement Header -->
          <div class="statement-header">
            <div class="statement-title">ACCOUNT STATEMENT</div>
            <div class="statement-subtitle">Confidential - For Account Holder Use Only</div>
            
            <div class="statement-meta">
              <div class="meta-group">
                <div class="meta-label">Account Holder</div>
                <div class="meta-value">${statement.userId.name}</div>
              </div>
              <div class="meta-group">
                <div class="meta-label">Statement Number</div>
                <div class="meta-value">${statementNumber}</div>
              </div>
              <div class="meta-group">
                <div class="meta-label">Account Type</div>
                <div class="meta-value">${statement.accountType.charAt(0).toUpperCase() + statement.accountType.slice(1)} Account</div>
              </div>
              <div class="meta-group">
                <div class="meta-label">Statement Period</div>
                <div class="meta-value">${new Date(statement.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} - ${new Date(statement.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
              <div class="meta-group">
                <div class="meta-label">Statement Date</div>
                <div class="meta-value">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
              <div class="meta-group">
                <div class="meta-label">Customer ID</div>
                <div class="meta-value">${statement.userId._id.toString().slice(-8).toUpperCase()}</div>
              </div>
            </div>
          </div>
          
          <!-- Account Summary -->
          <div class="account-summary">
            <div class="summary-title">ACCOUNT SUMMARY</div>
            <div class="summary-grid">
              <div class="summary-item">
                <div class="summary-item-label">Opening Balance</div>
                <div class="summary-item-value balance">$${openingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              <div class="summary-item">
                <div class="summary-item-label">Closing Balance</div>
                <div class="summary-item-value balance">$${closingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              <div class="summary-item">
                <div class="summary-item-label">Total Deposits</div>
                <div class="summary-item-value credit">+$${deposits.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              <div class="summary-item">
                <div class="summary-item-label">Total Withdrawals</div>
                <div class="summary-item-value debit">-$${withdrawals.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
            </div>
          </div>
          
          <!-- Transactions -->
          <div class="transactions-section">
            <div class="transactions-title">TRANSACTION HISTORY (${transactions.length} Transactions)</div>
            
            ${transactions.length > 0 ? `
              <table>
                <thead>
                  <tr>
                    <th>DATE</th>
                    <th>DESCRIPTION</th>
                    <th>TYPE</th>
                    <th style="text-align: right;">AMOUNT</th>
                    <th style="text-align: right;">BALANCE</th>
                  </tr>
                </thead>
                <tbody>
                  ${transactions.map((t: any, index: number) => {
                    const runningBalance = openingBalance + transactions.slice(0, index + 1).reduce((sum: number, tr: any) => {
                      return sum + (tr.type === 'credit' ? tr.amount : -tr.amount);
                    }, 0);
                    
                    return `
                      <tr>
                        <td class="date-col">${new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</td>
                        <td class="desc-col">${t.description}</td>
                        <td class="type-col">
                          <span class="type-badge type-${t.type === 'credit' ? 'credit' : 'debit'}">
                            ${t.type === 'credit' ? 'Deposit' : 'Withdrawal'}
                          </span>
                        </td>
                        <td class="amount-col amount-${t.type === 'credit' ? 'credit' : 'debit'}">
                          ${t.type === 'debit' ? '-' : '+'}$${t.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td class="balance-col">
                          $${runningBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            ` : `
              <div class="no-transactions">
                <div class="no-transactions-icon">📊</div>
                <p style="font-weight: 600; margin-bottom: 8px; color: #1e293b;">No Transactions Found</p>
                <p>There were no transactions during this statement period.</p>
              </div>
            `}
          </div>
          
          <!-- Footer -->
          <div class="statement-footer">
            <div class="footer-important">
              <div class="footer-important-title">IMPORTANT NOTICE</div>
              <div class="footer-important-text">
                Please review this statement carefully. If you notice any discrepancies or unauthorized transactions, 
                please contact us immediately at +1 (800) 123-4567 or support@zentribank.com. You have 60 days from 
                the statement date to report any errors.
              </div>
            </div>
            
            <div class="footer-contact">
              <div class="contact-item">
                <div class="contact-label">CUSTOMER SERVICE</div>
                +1 (800) 123-4567<br>
                Available 24/7
              </div>
              <div class="contact-item">
                <div class="contact-label">EMAIL SUPPORT</div>
                support@zentribank.com<br>
                Response within 24 hours
              </div>
              <div class="contact-item">
                <div class="contact-label">ONLINE BANKING</div>
                www.zentribank.com<br>
                Secure access anytime
              </div>
            </div>
            
            <div class="footer-legal">
              This statement is confidential and intended solely for the account holder named above. 
              ZentriBank is a member of FDIC. Deposits are insured up to $250,000 per depositor.<br>
              &copy; ${new Date().getFullYear()} ZentriBank. All rights reserved. | Member FDIC | Equal Housing Lender
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"ZentriBank" <${process.env.SMTP_USER}>`,
      to: statement.userId.email,
      subject: `ZentriBank Account Statement - ${statementNumber}`,
      html: emailHTML,
    });

    // Update statement status
    statement.status = 'sent';
    statement.sentAt = new Date();
    await statement.save();

    return NextResponse.json({
      success: true,
      message: 'Statement sent successfully'
    });

  } catch (error: any) {
    console.error('❌ Send statement error:', error);
    
    try {
      const { requestId } = await req.json();
      if (requestId) {
        await Statement.findByIdAndUpdate(requestId, {
          status: 'failed',
          errorMessage: error.message
        });
      }
    } catch (e) {
      console.error('Failed to update statement status:', e);
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send statement' },
      { status: 500 }
    );
  }
}