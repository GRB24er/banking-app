import nodemailer from 'nodemailer';
import { transactionEmail } from './emailTemplates';

export const transporter = nodemailer.createTransport({
  host: 'mail.privateemail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'admin@horizonglobalcapital.com',
    pass: 'Valmont15#',
  },
});

export const sendTransactionEmail = async (
  email: string,
  user: any,
  transaction: any
) => {
  const html = transactionEmail(transaction, user);

  await transporter.sendMail({
    from: 'Horizon Global Capital <admin@horizonglobalcapital.com>',
    to: email,
    subject: `Transaction Notification: ${transaction.type.toUpperCase()}`,
    html,
  });
};
