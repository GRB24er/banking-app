// src/lib/emailTemplates.ts
export const transactionEmail = (transaction: any, user: any) => {
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  
  const transactionTypes: Record<string, string> = {
    deposit: 'Deposit Received',
    withdrawal: 'Withdrawal Processed',
    transfer: 'Transfer Completed',
    debit: 'Account Debit',
    credit: 'Account Credit'
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Transaction Notification</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; }
    .header { background-color: #1a365d; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { padding: 30px; }
    .transaction-details { background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 25px; }
    .detail-row { display: flex; margin-bottom: 10px; }
    .detail-label { font-weight: 600; width: 150px; }
    .footer { text-align: center; padding: 20px; color: #777; font-size: 0.9em; }
    .logo { font-size: 24px; font-weight: bold; color: white; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Horizon Global Capital</div>
    </div>
    
    <div class="content">
      <h2>Transaction Notification</h2>
      <p>Dear ${user.name},</p>
      <p>This email confirms the following transaction on your account:</p>
      
      <div class="transaction-details">
        <div class="detail-row">
          <div class="detail-label">Transaction Type:</div>
          <div>${transactionTypes[transaction.type] || transaction.type}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Amount:</div>
          <div>${formatCurrency(transaction.amount)}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Date & Time:</div>
          <div>${new Date(transaction.date).toLocaleString()}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Description:</div>
          <div>${transaction.description}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">New Balance:</div>
          <div>${formatCurrency(transaction.balanceAfter)}</div>
        </div>
      </div>
      
      <p>If you did not initiate this transaction, please contact our security team immediately at 
        <a href="mailto:security@horizonglobal.com">security@horizonglobal.com</a>.
      </p>
      <p>Thank you for banking with Horizon Global Capital.</p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} Horizon Global Capital. All rights reserved.</p>
      <p>This is an automated message - please do not reply directly to this email.</p>
    </div>
  </div>
</body>
</html>
  `;
};