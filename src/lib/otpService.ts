// src/lib/otpService.ts
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import mail from '@/lib/mail';

// ============================================
// OTP MODEL
// ============================================
const OTPSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  email: { type: String, required: true },
  code: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['login', 'transfer', 'profile_update', 'password_reset', 'transaction', 'card_application'],
    required: true 
  },
  attempts: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true, index: true },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OTP = mongoose.models.OTP || mongoose.model('OTP', OTPSchema);

// ============================================
// CONFIG
// ============================================
const OTP_CONFIG = {
  LENGTH: 6,
  EXPIRY_MINUTES: 10,
  MAX_ATTEMPTS: 3,
  RESEND_COOLDOWN_SECONDS: 60,
};

// ============================================
// GENERATE OTP
// ============================================
export function generateOTPCode(): string {
  const buffer = crypto.randomBytes(4);
  const num = buffer.readUInt32BE(0);
  return (num % 900000 + 100000).toString();
}

// ============================================
// CREATE AND SEND OTP
// ============================================
export async function createAndSendOTP(
  userId: string,
  email: string,
  type: 'login' | 'transfer' | 'profile_update' | 'password_reset' | 'transaction' | 'card_application',
  metadata?: Record<string, any>
): Promise<{ success: boolean; message: string; expiresAt?: Date }> {
  try {
    await connectDB();

    const recentOTP = await OTP.findOne({
      userId,
      type,
      createdAt: { $gte: new Date(Date.now() - OTP_CONFIG.RESEND_COOLDOWN_SECONDS * 1000) }
    });

    if (recentOTP) {
      const waitTime = Math.ceil(
        (OTP_CONFIG.RESEND_COOLDOWN_SECONDS * 1000 - (Date.now() - new Date(recentOTP.createdAt).getTime())) / 1000
      );
      return { success: false, message: `Please wait ${waitTime} seconds before requesting a new code` };
    }

    await OTP.deleteMany({ userId, type, verified: false });

    const code = generateOTPCode();
    const expiresAt = new Date(Date.now() + OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000);

    await OTP.create({ userId, email, code, type, expiresAt, metadata });

    await sendOTPEmail(email, code, type);

    console.log(`[OTP] Sent ${type} OTP to ${email}: ${code}`);

    return { success: true, message: 'Verification code sent to your email', expiresAt };

  } catch (error: any) {
    console.error('[OTP] Error creating OTP:', error);
    return { success: false, message: 'Failed to send verification code' };
  }
}

// ============================================
// VERIFY OTP
// ============================================
export async function verifyOTP(
  userId: string,
  code: string,
  type: 'login' | 'transfer' | 'profile_update' | 'password_reset' | 'transaction' | 'card_application'
): Promise<{ success: boolean; message: string }> {
  try {
    await connectDB();

    const otp = await OTP.findOne({
      userId,
      type,
      verified: false,
      expiresAt: { $gte: new Date() }
    }).sort({ createdAt: -1 });

    if (!otp) {
      return { success: false, message: 'Verification code expired or not found. Please request a new one.' };
    }

    if (otp.attempts >= OTP_CONFIG.MAX_ATTEMPTS) {
      await OTP.deleteOne({ _id: otp._id });
      return { success: false, message: 'Too many failed attempts. Please request a new code.' };
    }

    if (otp.code !== code) {
      otp.attempts += 1;
      await otp.save();
      const remaining = OTP_CONFIG.MAX_ATTEMPTS - otp.attempts;
      return { success: false, message: `Invalid code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` };
    }

    await OTP.deleteOne({ _id: otp._id });
    console.log(`[OTP] Verified ${type} OTP for user ${userId}`);

    return { success: true, message: 'Verification successful' };

  } catch (error: any) {
    console.error('[OTP] Error verifying OTP:', error);
    return { success: false, message: 'Verification failed' };
  }
}

// ============================================
// SEND OTP EMAIL - HORIZON GLOBAL CAPITAL
// ============================================
async function sendOTPEmail(email: string, code: string, type: string): Promise<void> {
  const typeLabels: Record<string, { title: string; icon: string; color: string }> = {
    login: { title: 'Sign-In Verification', icon: '🔐', color: '#10b981' },
    transfer: { title: 'Transfer Authorization', icon: '💸', color: '#10b981' },
    profile_update: { title: 'Profile Update', icon: '👤', color: '#8b5cf6' },
    password_reset: { title: 'Password Reset', icon: '🔑', color: '#f59e0b' },
    transaction: { title: 'Transaction Verification', icon: '✓', color: '#10b981' },
    card_application: { title: 'Card Application', icon: '💳', color: '#3b82f6' },
  };

  const config = typeLabels[type] || { title: 'Security Verification', icon: '🔒', color: '#10b981' };
  const subject = `${config.title} - Horizon Global Capital Security Code`;
  const codeArray = code.split('');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${config.title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        
        <!-- Main Card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header with Gold Gradient -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#0f172a 100%);padding:40px 40px 32px;text-align:center;">
              <!-- Logo -->
              <div style="margin-bottom:8px;">
                <span style="font-size:28px;font-weight:800;color:#D4AF37;letter-spacing:-0.5px;">HORIZON</span>
              </div>
              <div style="margin-bottom:20px;">
                <span style="font-size:13px;font-weight:600;color:#94a3b8;letter-spacing:3px;text-transform:uppercase;">Global Capital</span>
              </div>
              <!-- Security Badge -->
              <span style="display:inline-block;background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.3);color:#10b981;font-size:11px;font-weight:600;padding:8px 16px;border-radius:100px;text-transform:uppercase;letter-spacing:1px;">
                ✓ Secured & Encrypted
              </span>
            </td>
          </tr>
          
          <!-- Icon & Title Section -->
          <tr>
            <td style="padding:40px 40px 24px;text-align:center;background:#ffffff;">
              <div style="width:80px;height:80px;margin:0 auto 24px;background:linear-gradient(135deg,${config.color}15 0%,${config.color}05 100%);border:2px solid ${config.color}25;border-radius:50%;line-height:80px;">
                <span style="font-size:36px;">${config.icon}</span>
              </div>
              <h1 style="margin:0 0 12px;font-size:26px;font-weight:700;color:#1e293b;letter-spacing:-0.3px;">
                ${config.title}
              </h1>
              <p style="margin:0;font-size:16px;color:#64748b;line-height:1.6;">
                Please use the verification code below to complete your request
              </p>
            </td>
          </tr>
          
          <!-- OTP Code Box -->
          <tr>
            <td style="padding:0 40px 32px;">
              <div style="background:linear-gradient(135deg,#f8fafc 0%,#f1f5f9 100%);border:2px solid #e2e8f0;border-radius:16px;padding:32px 24px;text-align:center;">
                <p style="margin:0 0 16px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:2px;font-weight:700;">
                  Your Verification Code
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                  <tr>
                    ${codeArray.map(digit => `
                      <td style="padding:0 5px;">
                        <div style="width:52px;height:68px;background:#ffffff;border:2px solid #D4AF37;border-radius:12px;line-height:68px;text-align:center;font-size:32px;font-weight:800;color:#1e293b;font-family:'SF Mono',Monaco,'Courier New',monospace;box-shadow:0 2px 8px rgba(212,175,55,0.15);">
                          ${digit}
                        </div>
                      </td>
                    `).join('')}
                  </tr>
                </table>
                <div style="margin-top:20px;">
                  <span style="display:inline-block;background:#fef3c7;color:#b45309;font-size:13px;font-weight:600;padding:8px 16px;border-radius:8px;">
                    ⏱ Code expires in 10 minutes
                  </span>
                </div>
              </div>
            </td>
          </tr>
          
          <!-- Security Warning -->
          <tr>
            <td style="padding:0 40px 32px;">
              <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:20px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="40" valign="top">
                      <div style="width:36px;height:36px;background:#fee2e2;border-radius:50%;text-align:center;line-height:36px;">
                        <span style="font-size:18px;">⚠️</span>
                      </div>
                    </td>
                    <td style="padding-left:16px;">
                      <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#dc2626;">
                        Security Warning
                      </p>
                      <p style="margin:0;font-size:14px;color:#7f1d1d;line-height:1.5;">
                        Never share this code with anyone. Horizon Global Capital employees will never ask for your verification code via phone, email, or text message.
                      </p>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
          
          <!-- Help Text -->
          <tr>
            <td style="padding:0 40px 40px;text-align:center;">
              <p style="margin:0;font-size:14px;color:#64748b;line-height:1.7;">
                Didn't request this code? You can safely ignore this email.<br>
                If you're concerned about your account security,<br>
                <a href="#" style="color:#D4AF37;text-decoration:none;font-weight:600;">contact our support team</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:32px 40px;border-top:1px solid #e2e8f0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <p style="margin:0 0 8px;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:600;">
                      Automated Security Message
                    </p>
                    <p style="margin:0 0 12px;font-size:13px;color:#64748b;">
                      © ${new Date().getFullYear()} Horizon Global Capital Ltd. All rights reserved.
                    </p>
                    <p style="margin:0;font-size:12px;color:#94a3b8;">
                      This email was sent to <span style="color:#475569;font-weight:500;">${email}</span>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
        
        <!-- Bottom Links -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin-top:24px;">
          <tr>
            <td align="center">
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                <a href="#" style="color:#64748b;text-decoration:none;margin:0 12px;">Privacy Policy</a>
                <span style="color:#cbd5e1;">•</span>
                <a href="#" style="color:#64748b;text-decoration:none;margin:0 12px;">Terms of Service</a>
                <span style="color:#cbd5e1;">•</span>
                <a href="#" style="color:#64748b;text-decoration:none;margin:0 12px;">Help Center</a>
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
HORIZON GLOBAL CAPITAL
Security Verification
================================

${config.title}

Your verification code is: ${code}

This code expires in 10 minutes.

SECURITY NOTICE: Never share this code with anyone. Horizon Global Capital employees will never ask for your verification code.

If you didn't request this code, please ignore this email.

© ${new Date().getFullYear()} Horizon Global Capital Ltd. All rights reserved.
`;

  await (mail as any).sendEmail({ to: email, subject, html, text });
}

// ============================================
// LEGACY EXPORTS
// ============================================
export enum OTPType {
  LOGIN = 'login',
  TRANSFER = 'transfer',
  PROFILE_UPDATE = 'profile_update',
  PASSWORD_RESET = 'password_reset',
  TRANSACTION_APPROVAL = 'transaction',
  CARD_APPLICATION = 'card_application'
}

export async function createOTP(
  userId: string,
  email: string,
  type: OTPType,
  metadata?: any,
  _phone?: string
): Promise<{ success: boolean; code?: string; token?: string; error?: string }> {
  const result = await createAndSendOTP(userId, email, type as any, metadata);
  return {
    success: result.success,
    error: result.success ? undefined : result.message,
  };
}