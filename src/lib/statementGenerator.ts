// src/lib/statementGenerator.ts
import PDFDocument from 'pdfkit';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import mail from '@/lib/mail';

interface StatementOptions {
  userId: string;
  startDate: Date;
  endDate: Date;
  accountType?: 'checking' | 'savings' | 'investment' | 'all';
  format?: 'pdf' | 'csv';
}

interface TransactionItem {
  date: Date;
  description: string;
  type: string;
  reference: string;
  amount: number;
  balance: number;
  status: string;
}

// ============================================
// GENERATE PDF STATEMENT
// ============================================
export async function generateStatement(options: StatementOptions): Promise<Buffer> {
  await connectDB();

  const { userId, startDate, endDate, accountType = 'all' } = options;

  // Get user
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  // Get transactions
  const query: any = {
    userId,
    date: { $gte: startDate, $lte: endDate },
  };
  if (accountType !== 'all') {
    query.accountType = accountType;
  }

  const transactions = await Transaction.find(query).sort({ date: 1 });

  // Calculate balances
  const openingBalance = await calculateOpeningBalance(userId, startDate, accountType);
  const closingBalance = calculateClosingBalance(openingBalance, transactions);

  // Generate PDF
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ===== HEADER =====
    doc.rect(0, 0, 595, 120).fill('#0f172a');
    
    // Logo
    doc.fontSize(28).fillColor('#D4AF37').font('Helvetica-Bold')
       .text('HORIZON', 50, 40);
    doc.fontSize(10).fillColor('#94a3b8').font('Helvetica')
       .text('GLOBAL CAPITAL', 50, 70);

    // Statement Title
    doc.fontSize(12).fillColor('#ffffff').font('Helvetica-Bold')
       .text('ACCOUNT STATEMENT', 400, 40, { align: 'right' });
    doc.fontSize(10).fillColor('#94a3b8').font('Helvetica')
       .text(`${formatDate(startDate)} - ${formatDate(endDate)}`, 400, 58, { align: 'right' });

    // ===== ACCOUNT INFO =====
    doc.fillColor('#1e293b');
    let y = 150;

    // Left column - Account holder
    doc.fontSize(10).fillColor('#64748b').text('ACCOUNT HOLDER', 50, y);
    doc.fontSize(12).fillColor('#1e293b').font('Helvetica-Bold')
       .text(user.name || 'Account Holder', 50, y + 15);
    doc.fontSize(10).fillColor('#64748b').font('Helvetica')
       .text(user.email, 50, y + 32);

    // Right column - Account details
    doc.fontSize(10).fillColor('#64748b').text('ACCOUNT NUMBER', 350, y);
    doc.fontSize(12).fillColor('#1e293b').font('Helvetica-Bold')
       .text(maskAccountNumber(user.accountNumber || 'N/A'), 350, y + 15);
    
    doc.fontSize(10).fillColor('#64748b').font('Helvetica')
       .text('STATEMENT DATE', 350, y + 40);
    doc.fontSize(10).fillColor('#1e293b')
       .text(formatDate(new Date()), 350, y + 55);

    // ===== SUMMARY BOX =====
    y = 250;
    doc.rect(50, y, 495, 80).fill('#f8fafc').stroke('#e2e8f0');
    
    // Opening Balance
    doc.fontSize(9).fillColor('#64748b').text('OPENING BALANCE', 70, y + 15);
    doc.fontSize(14).fillColor('#1e293b').font('Helvetica-Bold')
       .text(formatCurrency(openingBalance), 70, y + 32);

    // Total Credits
    const totalCredits = transactions.filter(t => isCredit(t.type)).reduce((sum, t) => sum + t.amount, 0);
    doc.fontSize(9).fillColor('#64748b').font('Helvetica').text('TOTAL CREDITS', 200, y + 15);
    doc.fontSize(14).fillColor('#22c55e').font('Helvetica-Bold')
       .text(`+${formatCurrency(totalCredits)}`, 200, y + 32);

    // Total Debits
    const totalDebits = transactions.filter(t => isDebit(t.type)).reduce((sum, t) => sum + t.amount, 0);
    doc.fontSize(9).fillColor('#64748b').font('Helvetica').text('TOTAL DEBITS', 340, y + 15);
    doc.fontSize(14).fillColor('#ef4444').font('Helvetica-Bold')
       .text(`-${formatCurrency(totalDebits)}`, 340, y + 32);

    // Closing Balance
    doc.fontSize(9).fillColor('#64748b').font('Helvetica').text('CLOSING BALANCE', 470, y + 15);
    doc.fontSize(14).fillColor('#1e293b').font('Helvetica-Bold')
       .text(formatCurrency(closingBalance), 470, y + 32);

    // ===== TRANSACTIONS TABLE =====
    y = 360;
    
    // Table header
    doc.rect(50, y, 495, 25).fill('#0f172a');
    doc.fontSize(8).fillColor('#ffffff').font('Helvetica-Bold');
    doc.text('DATE', 60, y + 8);
    doc.text('DESCRIPTION', 130, y + 8);
    doc.text('REFERENCE', 300, y + 8);
    doc.text('AMOUNT', 400, y + 8);
    doc.text('BALANCE', 480, y + 8);

    y += 25;

    // Table rows
    let runningBalance = openingBalance;
    transactions.forEach((tx, index) => {
      if (y > 750) {
        doc.addPage();
        y = 50;
        // Repeat header
        doc.rect(50, y, 495, 25).fill('#0f172a');
        doc.fontSize(8).fillColor('#ffffff').font('Helvetica-Bold');
        doc.text('DATE', 60, y + 8);
        doc.text('DESCRIPTION', 130, y + 8);
        doc.text('REFERENCE', 300, y + 8);
        doc.text('AMOUNT', 400, y + 8);
        doc.text('BALANCE', 480, y + 8);
        y += 25;
      }

      // Alternate row colors
      if (index % 2 === 0) {
        doc.rect(50, y, 495, 22).fill('#f8fafc');
      }

      const amount = isCredit(tx.type) ? tx.amount : -tx.amount;
      runningBalance += amount;

      doc.fontSize(8).fillColor('#1e293b').font('Helvetica');
      doc.text(formatDate(tx.date), 60, y + 7);
      doc.text(truncate(tx.description || tx.type, 30), 130, y + 7);
      doc.text(tx.reference || '-', 300, y + 7);
      
      doc.fillColor(isCredit(tx.type) ? '#22c55e' : '#ef4444')
         .text(`${isCredit(tx.type) ? '+' : '-'}${formatCurrency(tx.amount)}`, 400, y + 7);
      
      doc.fillColor('#1e293b')
         .text(formatCurrency(runningBalance), 480, y + 7);

      y += 22;
    });

    // ===== FOOTER =====
    const footerY = 780;
    doc.fontSize(8).fillColor('#94a3b8').font('Helvetica');
    doc.text('This is a computer-generated statement and does not require a signature.', 50, footerY, { align: 'center', width: 495 });
    doc.text(`© ${new Date().getFullYear()} Horizon Global Capital Ltd. All rights reserved.`, 50, footerY + 12, { align: 'center', width: 495 });
    doc.text(`Generated on ${new Date().toLocaleString()}`, 50, footerY + 24, { align: 'center', width: 495 });

    doc.end();
  });
}

// ============================================
// GENERATE CSV STATEMENT
// ============================================
export async function generateCSVStatement(options: StatementOptions): Promise<string> {
  await connectDB();

  const { userId, startDate, endDate, accountType = 'all' } = options;

  const query: any = {
    userId,
    date: { $gte: startDate, $lte: endDate },
  };
  if (accountType !== 'all') {
    query.accountType = accountType;
  }

  const transactions = await Transaction.find(query).sort({ date: 1 });
  const openingBalance = await calculateOpeningBalance(userId, startDate, accountType);

  let csv = 'Date,Description,Type,Reference,Debit,Credit,Balance\n';
  let runningBalance = openingBalance;

  // Opening balance row
  csv += `${formatDate(startDate)},Opening Balance,,,,,${runningBalance.toFixed(2)}\n`;

  transactions.forEach(tx => {
    const amount = isCredit(tx.type) ? tx.amount : -tx.amount;
    runningBalance += amount;
    
    const debit = isDebit(tx.type) ? tx.amount.toFixed(2) : '';
    const credit = isCredit(tx.type) ? tx.amount.toFixed(2) : '';

    csv += `${formatDate(tx.date)},"${tx.description || tx.type}",${tx.type},${tx.reference || ''},${debit},${credit},${runningBalance.toFixed(2)}\n`;
  });

  return csv;
}

// ============================================
// EMAIL STATEMENT
// ============================================
export async function emailStatement(
  userId: string,
  startDate: Date,
  endDate: Date,
  accountType: 'checking' | 'savings' | 'investment' | 'all' = 'all'
): Promise<boolean> {
  try {
    await connectDB();

    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const pdfBuffer = await generateStatement({ userId, startDate, endDate, accountType });
    
    const periodText = `${formatDate(startDate)} to ${formatDate(endDate)}`;
    const filename = `Horizon_Statement_${formatDate(startDate).replace(/\//g, '-')}_${formatDate(endDate).replace(/\//g, '-')}.pdf`;

    const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Roboto,sans-serif;">
  <table width="100%" style="background:#f0f4f8;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#1a1a2e,#0f172a);padding:32px;text-align:center;">
            <span style="font-size:24px;font-weight:800;color:#D4AF37;">HORIZON</span>
            <div style="font-size:11px;color:#94a3b8;letter-spacing:2px;margin-top:4px;">GLOBAL CAPITAL</div>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h2 style="color:#1e293b;margin:0 0 16px;">Your Account Statement</h2>
            <p style="color:#64748b;line-height:1.6;margin:0 0 24px;">
              Dear ${user.name || 'Valued Customer'},<br><br>
              Please find attached your account statement for the period <strong>${periodText}</strong>.
            </p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:24px;">
              <p style="margin:0 0 8px;font-size:13px;color:#64748b;">Statement Period</p>
              <p style="margin:0;font-size:16px;color:#1e293b;font-weight:600;">${periodText}</p>
            </div>
            <p style="color:#64748b;font-size:14px;line-height:1.6;">
              If you have any questions about your statement, please contact our support team.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:24px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">
              © ${new Date().getFullYear()} Horizon Global Capital Ltd.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await (mail as any).sendEmail({
      to: user.email,
      subject: `Your Account Statement - ${periodText}`,
      html,
      text: `Your Horizon Global Capital account statement for ${periodText} is attached.`,
      attachments: [{ filename, content: pdfBuffer }],
    });

    return true;
  } catch (error) {
    console.error('[Statement] Failed to email statement:', error);
    return false;
  }
}

// ============================================
// HELPERS
// ============================================
async function calculateOpeningBalance(
  userId: string,
  startDate: Date,
  accountType: string
): Promise<number> {
  const user = await User.findById(userId);
  if (!user) return 0;

  // Get all transactions before start date
  const query: any = {
    userId,
    date: { $lt: startDate },
  };
  if (accountType !== 'all') {
    query.accountType = accountType;
  }

  const priorTransactions = await Transaction.find(query);
  
  let balance = 0;
  priorTransactions.forEach(tx => {
    if (isCredit(tx.type)) {
      balance += tx.amount;
    } else {
      balance -= tx.amount;
    }
  });

  return balance;
}

function calculateClosingBalance(openingBalance: number, transactions: any[]): number {
  let balance = openingBalance;
  transactions.forEach(tx => {
    if (isCredit(tx.type)) {
      balance += tx.amount;
    } else {
      balance -= tx.amount;
    }
  });
  return balance;
}

function isCredit(type: string): boolean {
  return /deposit|transfer-in|interest|credit/i.test(type || '');
}

function isDebit(type: string): boolean {
  return /withdraw|transfer-out|fee|debit|payment/i.test(type || '');
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length <= 4) return accountNumber;
  return '****' + accountNumber.slice(-4);
}

function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.substring(0, length - 3) + '...';
}
