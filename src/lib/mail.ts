import nodemailer from 'nodemailer';


// Using named exports
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
  user: { name: string },
  transaction: { type: string; amount: number; date: Date | string; description: string }
) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Transaction Notification</h2>
      <p>Hello ${user.name},</p>
      <p>Your recent transaction details:</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Type</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${transaction.type}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Amount</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${transaction.amount}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Date</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${
            transaction.date instanceof Date 
              ? transaction.date.toLocaleString() 
              : new Date(transaction.date).toLocaleString()
          }</td>
        </tr>
      </table>
    </div>
  `;

  await transporter.sendMail({
    from: 'Horizon Global Capital <admin@horizonglobalcapital.com>',
    to: email,
    subject: `Transaction Notification: ${transaction.type.toUpperCase()}`,
    html,
  });
};