import nodemailer from 'nodemailer';
import { transactionEmail } from './emailTemplates';

// ─────────────────────────────────────────
// Create Nodemailer transporter
// ─────────────────────────────────────────
export const transporter = nodemailer.createTransport({
  host: 'mail.privateemail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'admin@horizonglobalcapital.com',
    pass: 'Valmont15#',
  },
});

// ─────────────────────────────────────────
// Send Transaction Email (Named Export)
// ─────────────────────────────────────────
export const sendTransactionEmail = async (
  email: string,
  user: any,
  transaction: any
) => {
  try {
    const html = transactionEmail(transaction, user);

    await transporter.sendMail({
      from: 'Horizon Global Capital <admin@horizonglobalcapital.com>',
      to: email,
      subject: `Transaction Notification: ${transaction.type.toUpperCase()}`,
      html,
    });

    console.log(`✅ Email sent to ${email}`);
  } catch (error) {
    console.error('❌ Email sending failed:', error);
  }
};
