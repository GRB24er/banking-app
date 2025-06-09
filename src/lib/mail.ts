import nodemailer from 'nodemailer';
import { transactionEmail } from './emailTemplates';

// ─────────────────────────────────────────
// Nodemailer SMTP transporter (PrivateEmail)
// ─────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: 'mail.privateemail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'admin@horizonglobalcapital.com',
    pass: 'Valmont15#',
  },
});

// ─────────────────────────────────────────
// Nodemailer: Send transaction email
// ─────────────────────────────────────────
export const sendTransactionEmail = async (
  email: string,
  user: any,
  transaction: any
) => {
  try {
    await transporter.sendMail({
      from: 'Horizon Global Capital <admin@horizonglobalcapital.com>',
      to: email,
      subject: `Transaction Notification: ${transaction.type.toUpperCase()}`,
      html: transactionEmail(transaction, user),
    });

    console.log(`✅ Email sent to ${email}`);
  } catch (error) {
    console.error('❌ Email sending failed:', error);
  }
};

export default transporter;
