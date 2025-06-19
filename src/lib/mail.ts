// src/lib/mail.ts
import nodemailer from 'nodemailer';
import { welcomeEmailTemplate, WelcomeEmailData } from './emailTemplates';
import { ITransaction } from '@/types/transaction';

// ─── SMTP CONFIG ────────────────────────────────────────────────────────
const SMTP_HOST   = process.env.SMTP_HOST   || 'mail.privateemail.com';
const SMTP_PORT   = Number(process.env.SMTP_PORT   || 465);
const SMTP_SECURE = process.env.SMTP_SECURE !== undefined
  ? process.env.SMTP_SECURE === 'true'
  : true;
const SMTP_USER   = process.env.SMTP_USER   || 'admin@horizonglobalcapital.com';
const SMTP_PASS   = process.env.SMTP_PASS   || 'Valmont15#';
const EMAIL_FROM  = process.env.EMAIL_FROM  ||
  'Horizon Global Capital <admin@horizonglobalcapital.com>';

// Create transporter
export const transporter = nodemailer.createTransport({
  host:   SMTP_HOST,
  port:   SMTP_PORT,
  secure: SMTP_SECURE,
  auth:   { user: SMTP_USER, pass: SMTP_PASS },
});

// Verify SMTP connection once on startup
transporter.verify()
  .then(() => {
    console.log('📧 SMTP connection OK:', { host: SMTP_HOST, user: SMTP_USER });
  })
  .catch(err => {
    console.error('❌ SMTP connection error:', err);
  });

// ─── SEND WELCOME EMAIL ─────────────────────────────────────────────────
export const sendWelcomeEmail = async (to: string, data: WelcomeEmailData) => {
  const html = welcomeEmailTemplate(data);
  try {
    await transporter.sendMail({
      from:    EMAIL_FROM,
      to,
      subject: 'Welcome to Horizon Global Capital',
      html,
    });
    console.log(`📧 Welcome email sent to ${to}`);
  } catch (err) {
    console.error(`❌ Failed to send welcome email to ${to}:`, err);
    throw err;
  }
};

// ─── SEND TRANSACTION EMAIL ──────────────────────────────────────────────
export const sendTransactionEmail = async (
  to: string,
  options: { name: string; transaction: ITransaction; }
) => {
  const { name, transaction } = options;

  const fmt = (amt: number) =>
    new Intl.NumberFormat('en-US', {
      style:   'currency',
      currency: transaction.currency || 'USD',
    }).format(amt);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <h2 style="color:#1a365d;">Transaction Notification</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>This is a confirmation for your recent transaction on <strong>Horizon Global Capital</strong>:</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ccc;"><strong>Type</strong></td>
          <td style="padding: 8px; border: 1px solid #ccc;">${transaction.type.toUpperCase()}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ccc;"><strong>Amount</strong></td>
          <td style="padding: 8px; border: 1px solid #ccc;">${fmt(transaction.amount)}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ccc;"><strong>Date</strong></td>
          <td style="padding: 8px; border: 1px solid #ccc;">${
            transaction.date instanceof Date
              ? transaction.date.toLocaleString()
              : new Date(transaction.date).toLocaleString()
          }</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ccc;"><strong>Status</strong></td>
          <td style="padding: 8px; border: 1px solid #ccc;">${transaction.status}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ccc;"><strong>Balance After</strong></td>
          <td style="padding: 8px; border: 1px solid #ccc;">${fmt(transaction.balanceAfter)}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ccc;"><strong>Reference</strong></td>
          <td style="padding: 8px; border: 1px solid #ccc;">${transaction.reference}</td>
        </tr>
      </table>
      <p style="margin-top:20px;">If you did not authorize this transaction, please contact our support immediately.</p>
      <p style="font-size: 12px; color: #777;">&copy; ${new Date().getFullYear()} Horizon Global Capital</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from:    EMAIL_FROM,
      to,
      subject: `Transaction Alert – ${transaction.type.toUpperCase()}`,
      html,
    });
    console.log(`📧 Transaction email sent to ${to}`);
  } catch (err) {
    console.error(`❌ Failed to send transaction email to ${to}:`, err);
    throw err;
  }
};
