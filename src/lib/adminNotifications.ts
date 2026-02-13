// src/lib/adminNotifications.ts
import mail from '@/lib/mail';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'support@horizonglobalcapital.com';
const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',') || [ADMIN_EMAIL];

interface TransferNotification {
  type: 'incoming_transfer' | 'outgoing_transfer' | 'bitcoin_deposit' | 'bitcoin_withdrawal' | 'large_transaction' | 'new_user' | 'kyc_submitted' | 'suspicious_activity';
  userId: string;
  userEmail: string;
  userName: string;
  amount?: number;
  currency?: string;
  description?: string;
  accountType?: string;
  metadata?: Record<string, any>;
}

export async function notifyAdmin(notification: TransferNotification): Promise<void> {
  const { type, userId, userEmail, userName, amount, currency = 'USD', description, accountType, metadata } = notification;

  const typeConfig: Record<string, { title: string; icon: string; color: string; priority: string }> = {
    incoming_transfer: { title: '💰 Incoming Transfer Request', icon: '💰', color: '#10b981', priority: 'HIGH' },
    outgoing_transfer: { title: '📤 Outgoing Transfer Request', icon: '📤', color: '#f59e0b', priority: 'MEDIUM' },
    bitcoin_deposit: { title: '₿ Bitcoin Deposit Request', icon: '₿', color: '#f7931a', priority: 'HIGH' },
    bitcoin_withdrawal: { title: '₿ Bitcoin Withdrawal Request', icon: '₿', color: '#ef4444', priority: 'HIGH' },
    large_transaction: { title: '🚨 Large Transaction Alert', icon: '🚨', color: '#ef4444', priority: 'URGENT' },
    new_user: { title: '👤 New User Registration', icon: '👤', color: '#3b82f6', priority: 'LOW' },
    kyc_submitted: { title: '📋 KYC Documents Submitted', icon: '📋', color: '#8b5cf6', priority: 'MEDIUM' },
    suspicious_activity: { title: '⚠️ Suspicious Activity Detected', icon: '⚠️', color: '#ef4444', priority: 'URGENT' },
  };

  const config = typeConfig[type] || { title: 'Notification', icon: '📧', color: '#6b7280', priority: 'LOW' };
  
  const formattedAmount = amount ? new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: currency === 'BTC' ? 'USD' : currency 
  }).format(amount) : 'N/A';

  const subject = `[${config.priority}] ${config.title} - ${userName}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        
        <!-- Main Card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#0f172a 100%);padding:32px 40px;text-align:center;">
              <div style="margin-bottom:8px;">
                <span style="font-size:24px;font-weight:800;color:#D4AF37;">HORIZON</span>
              </div>
              <div style="margin-bottom:16px;">
                <span style="font-size:11px;font-weight:600;color:#94a3b8;letter-spacing:2px;text-transform:uppercase;">Global Capital - Admin Panel</span>
              </div>
              <span style="display:inline-block;background:${config.color}20;border:1px solid ${config.color}40;color:${config.color};font-size:12px;font-weight:700;padding:8px 20px;border-radius:100px;text-transform:uppercase;letter-spacing:1px;">
                ${config.priority} PRIORITY
              </span>
            </td>
          </tr>
          
          <!-- Alert Title -->
          <tr>
            <td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid #e2e8f0;">
              <div style="width:72px;height:72px;margin:0 auto 20px;background:${config.color}15;border:2px solid ${config.color}30;border-radius:50%;line-height:72px;font-size:32px;">
                ${config.icon}
              </div>
              <h1 style="margin:0;font-size:24px;font-weight:700;color:#1e293b;">
                ${config.title}
              </h1>
            </td>
          </tr>
          
          <!-- Details -->
          <tr>
            <td style="padding:32px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                    <p style="margin:0 0 4px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Customer Name</p>
                    <p style="margin:0;font-size:16px;color:#1e293b;font-weight:600;">${userName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                    <p style="margin:0 0 4px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Customer Email</p>
                    <p style="margin:0;font-size:16px;color:#1e293b;">${userEmail}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                    <p style="margin:0 0 4px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;font-weight:600;">User ID</p>
                    <p style="margin:0;font-size:14px;color:#64748b;font-family:monospace;">${userId}</p>
                  </td>
                </tr>
                ${amount ? `
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                    <p style="margin:0 0 4px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Amount</p>
                    <p style="margin:0;font-size:24px;color:${config.color};font-weight:700;">${currency === 'BTC' ? amount + ' BTC' : formattedAmount}</p>
                  </td>
                </tr>
                ` : ''}
                ${accountType ? `
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                    <p style="margin:0 0 4px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Account Type</p>
                    <p style="margin:0;font-size:16px;color:#1e293b;text-transform:capitalize;">${accountType}</p>
                  </td>
                </tr>
                ` : ''}
                ${description ? `
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 4px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Description</p>
                    <p style="margin:0;font-size:16px;color:#1e293b;">${description}</p>
                  </td>
                </tr>
                ` : ''}
              </table>

              ${metadata ? `
              <div style="margin-top:24px;padding:16px 20px;background:#fffbeb;border:1px solid #fde68a;border-radius:12px;">
                <p style="margin:0 0 8px;font-size:12px;color:#b45309;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Additional Details</p>
                <pre style="margin:0;font-size:13px;color:#78350f;white-space:pre-wrap;font-family:monospace;">${JSON.stringify(metadata, null, 2)}</pre>
              </div>
              ` : ''}
            </td>
          </tr>
          
          <!-- Action Required -->
          <tr>
            <td style="padding:0 40px 32px;">
              <div style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);border-radius:12px;padding:24px;text-align:center;">
                <p style="margin:0 0 16px;font-size:14px;color:#94a3b8;">
                  Action required in admin dashboard
                </p>
                <a href="${process.env.NEXTAUTH_URL || 'https://horizonglobalcapital.com'}/admin" style="display:inline-block;background:linear-gradient(135deg,#D4AF37 0%,#B8860B 100%);color:#000;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">
                  Open Admin Dashboard
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;color:#64748b;">
                Timestamp: ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'long' })}
              </p>
              <p style="margin:0;font-size:11px;color:#94a3b8;">
                © ${new Date().getFullYear()} Horizon Global Capital Ltd. - Admin Notification System
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `
HORIZON GLOBAL CAPITAL - ADMIN NOTIFICATION
============================================
Priority: ${config.priority}
Type: ${config.title}

CUSTOMER DETAILS:
- Name: ${userName}
- Email: ${userEmail}
- User ID: ${userId}
${amount ? `- Amount: ${currency === 'BTC' ? amount + ' BTC' : formattedAmount}` : ''}
${accountType ? `- Account: ${accountType}` : ''}
${description ? `- Description: ${description}` : ''}

Timestamp: ${new Date().toISOString()}

Please review in admin dashboard.
`;

  try {
    await (mail as any).sendEmail({
      to: ADMIN_EMAILS,
      subject,
      html,
      text,
    });
    console.log(`[Admin Notification] Sent ${type} notification for user ${userId}`);
  } catch (error) {
    console.error('[Admin Notification] Failed to send:', error);
  }
}

// Convenience functions
export const notifyIncomingTransfer = (data: Omit<TransferNotification, 'type'>) => 
  notifyAdmin({ ...data, type: 'incoming_transfer' });

export const notifyBitcoinDeposit = (data: Omit<TransferNotification, 'type'>) => 
  notifyAdmin({ ...data, type: 'bitcoin_deposit' });

export const notifyBitcoinWithdrawal = (data: Omit<TransferNotification, 'type'>) => 
  notifyAdmin({ ...data, type: 'bitcoin_withdrawal' });

export const notifyLargeTransaction = (data: Omit<TransferNotification, 'type'>) => 
  notifyAdmin({ ...data, type: 'large_transaction' });

export const notifyNewUser = (data: Omit<TransferNotification, 'type'>) => 
  notifyAdmin({ ...data, type: 'new_user' });

export const notifyKYCSubmission = (data: Omit<TransferNotification, 'type'>) => 
  notifyAdmin({ ...data, type: 'kyc_submitted' });

export const notifySuspiciousActivity = (data: Omit<TransferNotification, 'type'>) => 
  notifyAdmin({ ...data, type: 'suspicious_activity' });
