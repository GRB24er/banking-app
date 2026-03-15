// src/app/api/statements/download/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');
}

export async function GET(request: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountType = searchParams.get('accountType') || 'checking';
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    if (!startDateStr || !endDateStr) {
      return NextResponse.json({ error: 'Start date and end date are required' }, { status: 400 });
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    endDate.setHours(23, 59, 59, 999);

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Filter transactions by date range
    const transactions = (user.transactions || [])
      .filter((t: any) => {
        const txDate = new Date(t.date);
        return txDate >= startDate && txDate <= endDate;
      })
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate totals
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    transactions.forEach((t: any) => {
      const type = (t.type || '').toLowerCase();
      if (type.includes('deposit') || type.includes('transfer-in') || type.includes('interest') || type.includes('adjustment-credit')) {
        totalDeposits += Number(t.amount) || 0;
      } else {
        totalWithdrawals += Number(t.amount) || 0;
      }
    });

    // Get current balance for the account type
    const balanceKey = `${accountType}Balance` as keyof typeof user;
    const currentBalance = Number(user[balanceKey]) || 0;

    const periodStart = formatDate(startDate);
    const periodEnd = formatDate(endDate);
    const generatedAt = new Date().toLocaleString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
    });

    // Build transaction rows
    let transactionRows = '';
    if (transactions.length === 0) {
      transactionRows = `
        <tr>
          <td colspan="4" style="padding: 24px; text-align: center; color: #8E92A8; font-style: italic;">
            No transactions found for this period.
          </td>
        </tr>`;
    } else {
      transactions.forEach((t: any, index: number) => {
        const type = (t.type || '').toLowerCase();
        const isCredit = type.includes('deposit') || type.includes('transfer-in') || type.includes('interest') || type.includes('adjustment-credit');
        const amountColor = isCredit ? '#2ECC71' : '#E74C3C';
        const sign = isCredit ? '+' : '-';
        const bgColor = index % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
        transactionRows += `
          <tr style="background: ${bgColor};">
            <td style="padding: 10px 16px; border-bottom: 1px solid #E5E7EB; font-size: 13px;">${formatDate(t.date)}</td>
            <td style="padding: 10px 16px; border-bottom: 1px solid #E5E7EB; font-size: 13px;">${t.description || capitalize(t.type)}</td>
            <td style="padding: 10px 16px; border-bottom: 1px solid #E5E7EB; font-size: 13px; text-align: right; color: ${amountColor}; font-weight: 600;">${sign}${formatCurrency(Number(t.amount) || 0)}</td>
            <td style="padding: 10px 16px; border-bottom: 1px solid #E5E7EB; font-size: 13px; text-align: right;">${formatCurrency(Number(t.balanceAfter) || 0)}</td>
          </tr>`;
      });
    }

    // Generate printable HTML page
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Statement - ${capitalize(accountType)} - ${periodStart} to ${periodEnd}</title>
  <style>
    @media print {
      body { margin: 0; padding: 20px; }
      .no-print { display: none !important; }
      @page { margin: 1cm; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #1a1f2e;
      background: #f5f5f5;
      line-height: 1.5;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: #fff;
      box-shadow: 0 2px 20px rgba(0,0,0,0.08);
    }
    .print-bar {
      background: #1a1f2e;
      color: #fff;
      padding: 12px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
    }
    .print-bar button {
      background: #C9A84C;
      color: #1a1f2e;
      border: none;
      padding: 8px 24px;
      border-radius: 4px;
      font-weight: 600;
      cursor: pointer;
      font-size: 14px;
    }
    .print-bar button:hover { background: #d4b97c; }
    .header {
      background: #1a1f2e;
      color: #fff;
      padding: 32px;
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }
    .bank-name {
      font-size: 22px;
      font-weight: 700;
      color: #C9A84C;
      letter-spacing: 0.5px;
    }
    .bank-tagline {
      font-size: 12px;
      color: #8E92A8;
      font-style: italic;
      margin-top: 4px;
    }
    .statement-label {
      font-size: 11px;
      color: #8E92A8;
      text-transform: uppercase;
      letter-spacing: 1px;
      text-align: right;
    }
    .statement-title {
      font-size: 16px;
      font-weight: 600;
      margin-top: 4px;
      text-align: right;
    }
    .account-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      background: rgba(255,255,255,0.05);
      padding: 16px;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .info-item label {
      display: block;
      font-size: 11px;
      color: #8E92A8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .info-item span {
      font-size: 14px;
      font-weight: 600;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      padding: 24px 32px;
      border-bottom: 1px solid #E5E7EB;
    }
    .summary-item {
      text-align: center;
      padding: 16px;
      background: #F9FAFB;
      border-radius: 8px;
    }
    .summary-label {
      font-size: 12px;
      color: #8E92A8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .summary-value {
      font-size: 20px;
      font-weight: 700;
    }
    .summary-value.deposits { color: #2ECC71; }
    .summary-value.withdrawals { color: #E74C3C; }
    .summary-value.balance { color: #1a1f2e; }
    .transactions {
      padding: 24px 32px;
    }
    .transactions h3 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #1a1f2e;
    }
    .tx-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      overflow: hidden;
    }
    .tx-table th {
      background: #1a1f2e;
      color: #fff;
      padding: 12px 16px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      text-align: left;
    }
    .tx-table th:nth-child(3),
    .tx-table th:nth-child(4) {
      text-align: right;
    }
    .footer {
      padding: 24px 32px;
      background: #F9FAFB;
      border-top: 1px solid #E5E7EB;
      text-align: center;
    }
    .footer p {
      font-size: 11px;
      color: #8E92A8;
      margin-bottom: 4px;
    }
    .footer .disclaimer {
      font-size: 10px;
      color: #B0B4C0;
      margin-top: 12px;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <!-- Print Bar -->
  <div class="print-bar no-print">
    <span>Account Statement - Ready to download</span>
    <button onclick="window.print()">Print / Save as PDF</button>
  </div>

  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="header-top">
        <div>
          <div class="bank-name">Horizon Global Capital</div>
          <div class="bank-tagline">Global Vision. Local Precision.</div>
        </div>
        <div>
          <div class="statement-label">Account Statement</div>
          <div class="statement-title">${periodStart} - ${periodEnd}</div>
        </div>
      </div>
      <div class="account-info">
        <div class="info-item">
          <label>Account Holder</label>
          <span>${user.name}</span>
        </div>
        <div class="info-item">
          <label>Account Type</label>
          <span>${capitalize(accountType)}</span>
        </div>
        <div class="info-item">
          <label>Account Number</label>
          <span>${user.accountNumber || 'N/A'}</span>
        </div>
        <div class="info-item">
          <label>Statement Generated</label>
          <span>${generatedAt}</span>
        </div>
      </div>
    </div>

    <!-- Summary -->
    <div class="summary">
      <div class="summary-item">
        <div class="summary-label">Total Deposits</div>
        <div class="summary-value deposits">${formatCurrency(totalDeposits)}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Total Withdrawals</div>
        <div class="summary-value withdrawals">${formatCurrency(totalWithdrawals)}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Current Balance</div>
        <div class="summary-value balance">${formatCurrency(currentBalance)}</div>
      </div>
    </div>

    <!-- Transactions -->
    <div class="transactions">
      <h3>Transaction History (${transactions.length} transactions)</h3>
      <table class="tx-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
          ${transactionRows}
        </tbody>
      </table>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Horizon Global Capital. All rights reserved.</p>
      <p>This statement was generated electronically and is valid without signature.</p>
      <div class="disclaimer">
        This document is confidential and intended solely for the named account holder.
        If you have received this in error, please notify us immediately.
        Past performance is not indicative of future results. All balances are subject to verification.
      </div>
    </div>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error: any) {
    console.error('Statement download error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate statement' },
      { status: 500 }
    );
  }
}
