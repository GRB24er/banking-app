// src/lib/emailTemplates.ts
export interface TransactionDetail {
  type: 'deposit' | 'withdrawal' | 'transfer' | 'debit' | 'credit';
  date: string;
  description: string;
  amount: number;
  balanceAfter: number;
  status: 'Completed' | 'Pending';
  reference: string;
}

export interface WelcomeEmailData {
  name: string;
  balance: number;
  bitcoinBalance: number;
  accountStatus: string;
  transactions: TransactionDetail[];
  nextSteps: string[];
}

export function welcomeEmailTemplate(data: WelcomeEmailData): string {
  const { name, balance, bitcoinBalance, accountStatus, transactions, nextSteps } = data;
  const fmt = (amt: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amt);

  const labels: Record<TransactionDetail['type'], string> = {
    deposit: 'Deposit Received',
    withdrawal: 'Withdrawal Processed',
    transfer: 'Transfer Completed',
    debit: 'Account Debit',
    credit: 'Account Credit'
  };

  const rows = transactions.map(tx => {
    const icon = tx.status === 'Pending' ? '✓' : '✔';
    const label = labels[tx.type];
    const sign = tx.amount >= 0 ? '+' : '-';
    return `
      <tr>
        <td colspan="2" style="padding:8px 0;font-weight:bold;">${icon} ${label}</td>
      </tr>
      <tr><td colspan="2" style="padding:4px 8px;">${tx.date}</td></tr>
      <tr><td colspan="2" style="padding:4px 8px;font-style:italic;">${tx.description}</td></tr>
      <tr>
        <td style="padding:4px 8px;">${sign}${fmt(Math.abs(tx.amount))}</td>
        <td style="padding:4px 8px;">Balance: ${fmt(tx.balanceAfter)}</td>
      </tr>
      <tr><td colspan="2" style="padding:4px 8px;">[${tx.status}] Ref: ${tx.reference}</td></tr>
      <tr><td colspan="2" style="padding:8px 0;"></td></tr>
    `;
  }).join('');

  const steps = nextSteps.map(s => `<li style="margin-bottom:6px;">✓ ${s}</li>`).join('');

  return `
  <!DOCTYPE html>
  <html><head><meta charset="UTF-8"/><title>Welcome to Horizon Global Capital</title></head>
  <body style="margin:0;padding:0;background:#f4f4f4;font-family:Segoe UI,Tahoma,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px;background:#f4f4f4;">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;">
          <tr style="background:#1a365d;color:#fff;">
            <td style="padding:20px;text-align:center;font-size:24px;font-weight:bold;">
              Horizon Global Capital
            </td>
          </tr>
          <tr><td style="padding:30px;">
            <h2 style="margin:0 0 16px;">Welcome, ${name}!</h2>
            <p style="margin-bottom:20px;">Here’s your account snapshot:</p>
            <p style="font-size:18px;font-weight:bold;">Available Balance: ${fmt(balance)}</p>
            <p style="font-size:14px;margin-top:4px;">Bitcoin Balance: ${bitcoinBalance.toFixed(8)} BTC</p>
            <p style="font-size:14px;margin-top:4px;">Account Status: ${accountStatus}</p>
            <h3 style="margin:16px 0 8px;">Recent Transactions:</h3>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:20px;">
              ${rows}
            </table>
            <h3 style="margin:16px 0 8px;">Next Steps:</h3>
            <ul style="padding-left:20px;margin-top:0;">${steps}</ul>
            <p style="font-size:14px;color:#555;margin-top:20px;">Questions? Reply to this email or call support.</p>
          </td></tr>
          <tr style="background:#eee;color:#777;">
            <td style="padding:15px;text-align:center;font-size:12px;">
              © ${new Date().getFullYear()} Horizon Global Capital. Do not reply to this automated message.
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body></html>
  `;
}
