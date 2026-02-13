// src/lib/statementGenerator.ts
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import mail from '@/lib/mail';

// ============================================
// STATEMENT DATA INTERFACE
// ============================================
interface StatementData {
  user: {
    name: string;
    email: string;
    accountNumber: string;
    address?: string;
  };
  period: {
    start: Date;
    end: Date;
  };
  accounts: {
    type: string;
    openingBalance: number;
    closingBalance: number;
    currency: string;
  }[];
  transactions: {
    date: Date;
    description: string;
    type: string;
    amount: number;
    currency: string;
    balance: number;
    reference: string;
  }[];
  summary: {
    totalCredits: number;
    totalDebits: number;
    totalFees: number;
    netChange: number;
  };
}

// ============================================
// GENERATE STATEMENT DATA
// ============================================
export async function generateStatementData(
  userId: string,
  startDate: Date,
  endDate: Date,
  accountType?: 'checking' | 'savings' | 'investment' | 'all'
): Promise<StatementData | null> {
  await connectDB();

  const user = await User.findById(userId);
  if (!user) return null;

  // Get transactions for period
  const query: any = {
    userId,
    createdAt: { $gte: startDate, $lte: endDate },
  };

  if (accountType && accountType !== 'all') {
    query.accountType = accountType;
  }

  const transactions = await Transaction.find(query).sort({ createdAt: 1 });

  // Calculate summary
  let totalCredits = 0;
  let totalDebits = 0;
  let totalFees = 0;

  const formattedTransactions = transactions.map((tx: any) => {
    const amount = parseFloat(tx.amount?.toString() || '0');
    
    if (tx.type?.includes('deposit') || tx.type?.includes('credit') || tx.type?.includes('transfer-in')) {
      totalCredits += Math.abs(amount);
    } else if (tx.type?.includes('fee')) {
      totalFees += Math.abs(amount);
      totalDebits += Math.abs(amount);
    } else {
      totalDebits += Math.abs(amount);
    }

    return {
      date: tx.createdAt || tx.date,
      description: tx.description || tx.type,
      type: tx.type,
      amount: Math.abs(amount),
      currency: tx.currency || 'USD',
      balance: tx.balanceAfter || 0,
      reference: tx.reference || tx._id.toString().slice(-8).toUpperCase(),
    };
  });

  // Get account balances
  const accounts = [];
  
  if (!accountType || accountType === 'all' || accountType === 'checking') {
    accounts.push({
      type: 'Checking',
      openingBalance: (user.checkingBalance || 0) - (totalCredits - totalDebits),
      closingBalance: user.checkingBalance || 0,
      currency: 'USD',
    });
  }
  
  if (!accountType || accountType === 'all' || accountType === 'savings') {
    accounts.push({
      type: 'Savings',
      openingBalance: user.savingsBalance || 0,
      closingBalance: user.savingsBalance || 0,
      currency: 'USD',
    });
  }

  return {
    user: {
      name: user.name,
      email: user.email,
      accountNumber: user.accountNumber || 'N/A',
      address: user.address,
    },
    period: {
      start: startDate,
      end: endDate,
    },
    accounts,
    transactions: formattedTransactions,
    summary: {
      totalCredits,
      totalDebits,
      totalFees,
      netChange: totalCredits - totalDebits,
    },
  };
}

// ============================================
// GENERATE HTML STATEMENT
// ============================================
export function generateStatementHTML(data: StatementData): string {
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatShortDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const transactionRows = data.transactions.map(tx => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#475569;">${formatShortDate(tx.date)}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#1e293b;">${tx.description}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#64748b;font-family:monospace;">${tx.reference}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;font-size:13px;text-align:right;color:${tx.type.includes('deposit') || tx.type.includes('credit') ? '#16a34a' : '#dc2626'};font-weight:600;">
        ${tx.type.includes('deposit') || tx.type.includes('credit') ? '+' : '-'}${formatCurrency(tx.amount, tx.currency)}
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;font-size:13px;text-align:right;color:#1e293b;font-weight:500;">${formatCurrency(tx.balance, tx.currency)}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Statement - Horizon Global Capital</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:800px;margin:0 auto;padding:40px 20px;">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1a1a2e 0%,#0f172a 100%);border-radius:16px 16px 0 0;padding:40px;color:#fff;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <div style="margin-bottom:8px;">
              <span style="font-size:32px;font-weight:800;color:#D4AF37;">HORIZON</span>
            </div>
            <div>
              <span style="font-size:12px;font-weight:600;color:#94a3b8;letter-spacing:2px;text-transform:uppercase;">Global Capital</span>
            </div>
          </td>
          <td style="text-align:right;">
            <div style="font-size:24px;font-weight:700;margin-bottom:8px;">Account Statement</div>
            <div style="font-size:14px;color:#94a3b8;">
              ${formatDate(data.period.start)} - ${formatDate(data.period.end)}
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Account Info -->
    <div style="background:#fff;padding:32px 40px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:top;width:50%;">
            <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Account Holder</div>
            <div style="font-size:18px;font-weight:600;color:#1e293b;margin-bottom:4px;">${data.user.name}</div>
            <div style="font-size:14px;color:#64748b;">${data.user.email}</div>
          </td>
          <td style="vertical-align:top;text-align:right;">
            <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Account Number</div>
            <div style="font-size:18px;font-weight:600;color:#1e293b;font-family:monospace;">${data.user.accountNumber}</div>
            <div style="font-size:12px;color:#64748b;margin-top:8px;">Generated: ${formatDate(new Date())}</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Account Summary -->
    <div style="background:#f8fafc;padding:24px 40px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
      <div style="font-size:14px;font-weight:600;color:#1e293b;margin-bottom:16px;">Account Summary</div>
      <table width="100%" cellpadding="0" cellspacing="8">
        <tr>
          ${data.accounts.map(acc => `
            <td style="background:#fff;padding:20px;border-radius:12px;border:1px solid #e2e8f0;text-align:center;">
              <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">${acc.type}</div>
              <div style="font-size:24px;font-weight:700;color:#1e293b;">${formatCurrency(acc.closingBalance, acc.currency)}</div>
            </td>
          `).join('')}
        </tr>
      </table>
    </div>

    <!-- Summary Stats -->
    <div style="background:#fff;padding:24px 40px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="text-align:center;padding:16px;">
            <div style="font-size:12px;color:#64748b;text-transform:uppercase;margin-bottom:4px;">Total Credits</div>
            <div style="font-size:20px;font-weight:700;color:#16a34a;">+${formatCurrency(data.summary.totalCredits)}</div>
          </td>
          <td style="text-align:center;padding:16px;border-left:1px solid #e2e8f0;">
            <div style="font-size:12px;color:#64748b;text-transform:uppercase;margin-bottom:4px;">Total Debits</div>
            <div style="font-size:20px;font-weight:700;color:#dc2626;">-${formatCurrency(data.summary.totalDebits)}</div>
          </td>
          <td style="text-align:center;padding:16px;border-left:1px solid #e2e8f0;">
            <div style="font-size:12px;color:#64748b;text-transform:uppercase;margin-bottom:4px;">Fees</div>
            <div style="font-size:20px;font-weight:700;color:#f59e0b;">${formatCurrency(data.summary.totalFees)}</div>
          </td>
          <td style="text-align:center;padding:16px;border-left:1px solid #e2e8f0;">
            <div style="font-size:12px;color:#64748b;text-transform:uppercase;margin-bottom:4px;">Net Change</div>
            <div style="font-size:20px;font-weight:700;color:${data.summary.netChange >= 0 ? '#16a34a' : '#dc2626'};">
              ${data.summary.netChange >= 0 ? '+' : ''}${formatCurrency(data.summary.netChange)}
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Transactions -->
    <div style="background:#fff;padding:32px 40px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
      <div style="font-size:14px;font-weight:600;color:#1e293b;margin-bottom:16px;">Transaction History</div>
      ${data.transactions.length > 0 ? `
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
          <thead>
            <tr style="background:#f8fafc;">
              <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e2e8f0;">Date</th>
              <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e2e8f0;">Description</th>
              <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e2e8f0;">Reference</th>
              <th style="padding:12px 16px;text-align:right;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e2e8f0;">Amount</th>
              <th style="padding:12px 16px;text-align:right;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e2e8f0;">Balance</th>
            </tr>
          </thead>
          <tbody>
            ${transactionRows}
          </tbody>
        </table>
      ` : `
        <div style="text-align:center;padding:40px;color:#64748b;">
          No transactions found for this period.
        </div>
      `}
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;border-radius:0 0 16px 16px;padding:24px 40px;border:1px solid #e2e8f0;border-top:none;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:11px;color:#64748b;line-height:1.6;">
            <p style="margin:0 0 8px;">This statement is for informational purposes. Report discrepancies within 30 days.</p>
            <p style="margin:0;">Questions? Contact support@horizonglobalcapital.com</p>
          </td>
          <td style="text-align:right;font-size:11px;color:#94a3b8;">
            <p style="margin:0;">© ${new Date().getFullYear()} Horizon Global Capital Ltd.</p>
          </td>
        </tr>
      </table>
    </div>

  </div>
</body>
</html>`;
}

// ============================================
// SEND STATEMENT EMAIL
// ============================================
export async function sendStatementEmail(
  userId: string,
  startDate: Date,
  endDate: Date,
  accountType?: 'checking' | 'savings' | 'investment' | 'all'
): Promise<{ success: boolean; message: string }> {
  try {
    const data = await generateStatementData(userId, startDate, endDate, accountType);
    
    if (!data) {
      return { success: false, message: 'User not found' };
    }

    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    };

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const subject = `Your Account Statement - ${formatDate(startDate)} to ${formatDate(endDate)}`;

    const emailHtml = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#0f172a 100%);padding:32px;text-align:center;">
              <span style="font-size:28px;font-weight:800;color:#D4AF37;">HORIZON</span>
              <div style="font-size:11px;color:#94a3b8;letter-spacing:2px;margin-top:4px;">GLOBAL CAPITAL</div>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h1 style="margin:0 0 16px;font-size:24px;color:#1e293b;">Your Statement is Ready</h1>
              <p style="margin:0 0 24px;font-size:16px;color:#64748b;line-height:1.6;">
                Dear ${data.user.name},<br><br>
                Your account statement for <strong>${formatDate(startDate)}</strong> to <strong>${formatDate(endDate)}</strong> is ready.
              </p>
              
              <div style="background:#f8fafc;border-radius:12px;padding:24px;margin-bottom:24px;">
                <div style="font-size:14px;font-weight:600;color:#1e293b;margin-bottom:16px;">Summary</div>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:8px 0;color:#64748b;">Credits:</td>
                    <td style="padding:8px 0;text-align:right;color:#16a34a;font-weight:600;">+${formatCurrency(data.summary.totalCredits)}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#64748b;">Debits:</td>
                    <td style="padding:8px 0;text-align:right;color:#dc2626;font-weight:600;">-${formatCurrency(data.summary.totalDebits)}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#64748b;">Fees:</td>
                    <td style="padding:8px 0;text-align:right;color:#f59e0b;font-weight:600;">${formatCurrency(data.summary.totalFees)}</td>
                  </tr>
                  <tr style="border-top:1px solid #e2e8f0;">
                    <td style="padding:12px 0 0;color:#1e293b;font-weight:600;">Net Change:</td>
                    <td style="padding:12px 0 0;text-align:right;color:${data.summary.netChange >= 0 ? '#16a34a' : '#dc2626'};font-weight:700;font-size:18px;">
                      ${data.summary.netChange >= 0 ? '+' : ''}${formatCurrency(data.summary.netChange)}
                    </td>
                  </tr>
                </table>
              </div>

              <p style="margin:0;font-size:14px;color:#64748b;">
                Log in to your dashboard to view the full statement with all transaction details.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;padding:24px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#64748b;">
                © ${new Date().getFullYear()} Horizon Global Capital Ltd.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    await (mail as any).sendEmail({
      to: data.user.email,
      subject,
      html: emailHtml,
    });

    return { success: true, message: 'Statement sent successfully' };
  } catch (error: any) {
    console.error('[Statement] Error:', error);
    return { success: false, message: error.message || 'Failed to send statement' };
  }
}
