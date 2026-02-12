// src/lib/otpService.ts
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import { sendEmail } from '@/lib/mail';

// ============================================
// OTP MODEL
// ============================================
const OTPSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  email: { type: String, required: true },
  code: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['login', 'transfer', 'profile_update', 'password_reset', 'transaction'],
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
  type: 'login' | 'transfer' | 'profile_update' | 'password_reset' | 'transaction',
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
  type: 'login' | 'transfer' | 'profile_update' | 'password_reset' | 'transaction'
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
// SEND OTP EMAIL
// ============================================
async function sendOTPEmail(email: string, code: string, type: string): Promise<void> {
  const typeLabels: Record<string, { title: string; icon: string; color: string }> = {
    login: { title: 'Sign-In Verification', icon: '🔐', color: '#3b82f6' },
    transfer: { title: 'Transfer Authorization', icon: '💸', color: '#22c55e' },
    profile_update: { title: 'Profile Update', icon: '👤', color: '#8b5cf6' },
    password_reset: { title: 'Password Reset', icon: '🔑', color: '#f59e0b' },
    transaction: { title: 'Transaction Verification', icon: '✓', color: '#22c55e' },
  };

  const config = typeLabels[type] || { title: 'Security Verification', icon: '🔒', color: '#3b82f6' };
  const subject = `${config.title} - ZentriBank Security Code`;
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
<body style="margin:0;padding:0;background-color:#000000;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:linear-gradient(180deg,#0d0d12 0%,#12121a 100%);border-radius:24px;overflow:hidden;border:1px solid #1f1f2e;box-shadow:0 24px 48px rgba(0,0,0,0.4);">
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,#B8860B 0%,#D4AF37 50%,#B8860B 100%);"></td>
          </tr>
          <tr>
            <td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid #1a1a24;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="display:inline-block;margin-bottom:16px;">
                      <span style="font-size:32px;font-weight:800;background:linear-gradient(135deg,#D4AF37 0%,#F4D03F 50%,#D4AF37 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:-0.5px;">ZentriBank</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:8px;">
                    <span style="display:inline-block;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.2);color:#22c55e;font-size:11px;font-weight:600;padding:6px 14px;border-radius:100px;text-transform:uppercase;letter-spacing:1px;">
                      ● Secured Connection
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px 0;text-align:center;">
              <div style="width:72px;height:72px;margin:0 auto 20px;background:linear-gradient(135deg,${config.color}20 0%,${config.color}10 100%);border:2px solid ${config.color}30;border-radius:20px;display:flex;align-items:center;justify-content:center;">
                <span style="font-size:32px;line-height:72px;">${config.icon}</span>
              </div>
              <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
                ${config.title}
              </h1>
              <p style="margin:0;font-size:15px;color:#6b7280;line-height:1.5;">
                Enter this code to verify your identity
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <div style="background:#0a0a0f;border:2px solid #D4AF37;border-radius:16px;padding:28px 20px;text-align:center;">
                <p style="margin:0 0 12px;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:2px;font-weight:600;">
                  Verification Code
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                  <tr>
                    ${codeArray.map(digit => `
                      <td style="padding:0 4px;">
                        <div style="width:48px;height:60px;background:linear-gradient(180deg,#1a1a24 0%,#141418 100%);border:1px solid #2a2a3a;border-radius:12px;line-height:60px;text-align:center;font-size:28px;font-weight:700;color:#D4AF37;font-family:'SF Mono',Monaco,'Courier New',monospace;">
                          ${digit}
                        </div>
                      </td>
                    `).join('')}
                  </tr>
                </table>
                <div style="margin-top:16px;padding-top:16px;border-top:1px solid #1a1a24;">
                  <span style="display:inline-block;background:rgba(239,68,68,0.1);color:#ef4444;font-size:12px;font-weight:500;padding:6px 12px;border-radius:6px;">
                    ⏱ Expires in 10 minutes
                  </span>
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px;">
              <div style="background:linear-gradient(135deg,rgba(239,68,68,0.08) 0%,rgba(239,68,68,0.03) 100%);border:1px solid rgba(239,68,68,0.15);border-radius:12px;padding:16px 20px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="24" valign="top" style="padding-right:12px;">
                      <span style="font-size:16px;">⚠️</span>
                    </td>
                    <td>
                      <p style="margin:0;font-size:13px;color:#fca5a5;line-height:1.5;font-weight:500;">
                        <strong style="color:#ef4444;">Security Alert:</strong> Never share this code. ZentriBank employees will never ask for your verification code via phone, email, or text.
                      </p>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px;text-align:center;">
              <p style="margin:0;font-size:13px;color:#4b5563;line-height:1.6;">
                Didn't request this code? You can safely ignore this email.<br>
                If you're concerned about your account security,<br>
                <a href="#" style="color:#3b82f6;text-decoration:none;font-weight:500;">contact our support team</a>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#0a0a0f;padding:24px 40px;border-top:1px solid #1a1a24;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <p style="margin:0 0 8px;font-size:11px;color:#4b5563;text-transform:uppercase;letter-spacing:1px;">
                      Automated Security Message
                    </p>
                    <p style="margin:0;font-size:12px;color:#6b7280;">
                      © ${new Date().getFullYear()} ZentriBank Capital Ltd. All rights reserved.
                    </p>
                    <p style="margin:8px 0 0;font-size:11px;color:#374151;">
                      This email was sent to <span style="color:#9ca3af;">${email}</span>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin-top:24px;">
          <tr>
            <td align="center">
              <p style="margin:0;font-size:11px;color:#4b5563;">
                <a href="#" style="color:#6b7280;text-decoration:none;margin:0 12px;">Privacy Policy</a>
                <span style="color:#374151;">•</span>
                <a href="#" style="color:#6b7280;text-decoration:none;margin:0 12px;">Terms of Service</a>
                <span style="color:#374151;">•</span>
                <a href="#" style="color:#6b7280;text-decoration:none;margin:0 12px;">Help Center</a>
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
ZentriBank Security Verification
================================

${config.title}

Your verification code is: ${code}

This code expires in 10 minutes.

SECURITY NOTICE: Never share this code with anyone. ZentriBank employees will never ask for your verification code.

If you didn't request this code, please ignore this email.

© ${new Date().getFullYear()} ZentriBank Capital Ltd.
`;

 await sendEmail({ to: email, subject, html, text });
}

// ============================================
// LEGACY EXPORTS
// ============================================
export enum OTPType {
  LOGIN = 'login',
  TRANSFER = 'transfer',
  PROFILE_UPDATE = 'profile_update',
  PASSWORD_RESET = 'password_reset',
  TRANSACTION_APPROVAL = 'transaction'
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