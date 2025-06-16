import nodemailer from 'nodemailer';
import { transactionEmail } from './emailTemplates'; // Make sure this function exists and returns HTML

// ─────────────────────────────────────────
// Nodemailer SMTP transporter (PrivateEmail)
// ─────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: 'mail.privateemail.com',         // ✅ PrivateEmail SMTP
  port: 465,                              // ✅ Secure SSL port
  secure: true,                           // ✅ Use SSL
  auth: {
    user: 'admin@horizonglobalcapital.com', // ✅ Full email login
    pass: 'Valmont15#',                      // ✅ Your mailbox password
  },
});

// ─────────────────────────────────────────
// Send transaction email
// ─────────────────────────────────────────
export const sendTransactionEmail = async (
  email: string,
  user: any,
  transaction: any
) => {
  try {
    const emailHtml = transactionEmail(transaction, user); // Function should return full HTML string

    await transporter.sendMail({
      from: 'Horizon Global Capital <admin@horizonglobalcapital.com>', // ✅ Display name + email
      to: email,                                                       // ✅ Recipient's email
      subject: `Transaction Notification: ${transaction.type.toUpperCase()}`, // ✅ Subject line
      html: emailHtml,                                                 // ✅ HTML body from template
    });

    console.log(`✅ Email sent to ${email}`);
  } catch (error) {
    console.error('❌ Email sending failed:', error);
  }
};
