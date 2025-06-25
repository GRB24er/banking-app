// File: src/lib/mail.ts

import nodemailer from 'nodemailer';
import { welcomeEmailTemplate, WelcomeEmailData } from './emailTemplates';
import { ITransaction } from '@/types/transaction';

// ─── SMTP CONFIG ────────────────────────────────────────────────────────
const SMTP_HOST   = process.env.SMTP_HOST   || 'mail.privateemail.com';
const SMTP_PORT   = Number(process.env.SMTP_PORT   || 465);
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const SMTP_USER   = process.env.SMTP_USER   || 'admin@horizonglobalcapital.com';
const SMTP_PASS   = process.env.SMTP_PASS   || 'Valmont15#';
const EMAIL_FROM  = process.env.EMAIL_FROM  ||
  'Horizon Global Capital <admin@horizonglobalcapital.com>';

export const transporter = nodemailer.createTransport({
  host:   SMTP_HOST,
  port:   SMTP_PORT,
  secure: SMTP_SECURE,
  auth:   { user: SMTP_USER, pass: SMTP_PASS }
});

transporter.verify()
  .then(() => console.log('📧 SMTP connection OK'))
  .catch(err => console.error('❌ SMTP connection error:', err));

// ─── SEND WELCOME EMAIL ─────────────────────────────────────────────────
export async function sendWelcomeEmail(to: string, data: WelcomeEmailData) {
  const html = welcomeEmailTemplate(data);
  await transporter.sendMail({
    from:    EMAIL_FROM,
    to,
    subject: 'Welcome to Horizon Global Capital',
    html
  });
}

// ─── SEND TRANSACTION NOTIFICATION EMAIL ────────────────────────────────
export async function sendTransactionEmail(
  to: string,
  options: { name: string; transaction: ITransaction }
) {
  const { name, transaction } = options;
  const { type, amount, currency, date, balanceAfter, reference } = transaction;

  const direction = type === 'withdrawal' ? 'debited' : 'credited';
  const fmt       = (amt: number) =>
    new Intl.NumberFormat('en-US',{style:'currency',currency}).format(amt);
  const subject   = `Your account has been ${direction}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:20px 0">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.05)">
        <tr style="background:#2c3e50;color:#ecf0f1"><td style="padding:20px;text-align:center">
          <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo.png" alt="Logo" style="max-height:50px"/><br>
          <span>Your trusted banking partner</span>
        </td></tr>
        <tr><td style="padding:30px 20px;color:#333">
          <h1 style="margin:0 0 10px;font-size:20px">Hello ${name},</h1>
          <p>Your account has been <strong>${direction}</strong> with <strong>${fmt(amount)}</strong> on <strong>${new Date(date).toLocaleString()}</strong>.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:20px 0">
            <tr><th style="background:#f9f9f9;padding:10px;width:40%;text-align:left">Type</th><td style="padding:10px">${direction.charAt(0).toUpperCase()+direction.slice(1)}</td></tr>
            <tr><th style="background:#f9f9f9;padding:10px;text-align:left">Amount</th><td style="padding:10px">${fmt(amount)}</td></tr>
            <tr><th style="background:#f9f9f9;padding:10px;text-align:left">New Balance</th><td style="padding:10px">${fmt(balanceAfter)}</td></tr>
            <tr><th style="background:#f9f9f9;padding:10px;text-align:left">Reference</th><td style="padding:10px">${reference}</td></tr>
          </table>
          <p style="text-align:center">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
               style="display:inline-block;background:#27ae60;color:#fff;padding:12px 24px;border-radius:4px;text-decoration:none">
              View Your Dashboard
            </a>
          </p>
          <p style="font-size:12px;color:#777;margin-top:20px">If you did not authorize this, please contact support immediately.</p>
        </td></tr>
        <tr><td style="background:#ecf0f1;text-align:center;padding:15px;color:#777;font-size:12px">
          &copy; ${new Date().getFullYear()} Horizon Global Capital<br>
          123 Finance Ave, Suite 400, Capital City<br>
          <a href="mailto:support@horizonglobalcapital.com" style="color:#2c3e50">support@horizonglobalcapital.com</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
`;

  await transporter.sendMail({ from: EMAIL_FROM, to, subject, html });
}

// ─── SEND FULL BANK STATEMENT EMAIL ──────────────────────────────────────
export async function sendBankStatementEmail(
  to: string,
  transactions: {
    date: Date;
    type: string;
    currency: string;
    amount: number;
    description: string;
    reference?: string;
  }[]
) {
  const rows = transactions.map(tx => `
    <tr>
      <td style="padding:8px;border:1px solid #ddd">${new Date(tx.date).toLocaleDateString()}</td>
      <td style="padding:8px;border:1px solid #ddd">${tx.type.charAt(0).toUpperCase()+tx.type.slice(1)}</td>
      <td style="padding:8px;border:1px solid #ddd">${new Intl.NumberFormat('en-US',{style:'currency',currency:tx.currency}).format(tx.amount)}</td>
      <td style="padding:8px;border:1px solid #ddd">${tx.description}</td>
      <td style="padding:8px;border:1px solid #ddd">${tx.reference||'—'}</td>
    </tr>
  `).join('');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:20px 0">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.1)">
        <tr style="background:#2c3e50;color:#ecf0f1"><td style="padding:20px;text-align:center">
          <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo.png" alt="Horizon Global Capital" style="max-height:50px"/><br>
          <h1 style="margin:12px 0 0;font-size:24px;font-weight:400">Your Account Statement</h1>
        </td></tr>
        <tr><td style="padding:20px;color:#333;line-height:1.6">
          <p>Dear Customer,</p>
          <p>Below is a summary of your recent activity with <strong>Horizon Global Capital</strong> as of <strong>${new Date().toLocaleDateString()}</strong>.</p>
        </td></tr>
        <tr><td>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 20px 20px">
            <thead>
              <tr style="background:#f4f7f9">
                <th style="padding:12px;border:1px solid #ddd">Date</th>
                <th style="padding:12px;border:1px solid #ddd">Type</th>
                <th style="padding:12px;border:1px solid #ddd">Amount</th>
                <th style="padding:12px;border:1px solid #ddd">Description</th>
                <th style="padding:12px;border:1px solid #ddd">Reference</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </td></tr>
        <tr><td style="text-align:center;padding-bottom:30px">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/statements" 
             style="display:inline-block;background:#27ae60;color:#fff;padding:12px 24px;border-radius:4px;text-decoration:none;font-size:16px">
            View Full Statement Online
          </a>
        </td></tr>
        <tr><td style="background:#ecf0f1;text-align:center;padding:15px;color:#777;font-size:12px">
          &copy; ${new Date().getFullYear()} Horizon Global Capital<br>
          123 Finance Ave, Suite 400, Capital City<br>
          <a href="mailto:support@horizonglobalcapital.com" style="color:#2c3e50">support@horizonglobalcapital.com</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
`;

  await transporter.sendMail({
    from:    EMAIL_FROM,
    to,
    subject: 'Your Account Statement — Horizon Global Capital',
    html
  });
}
