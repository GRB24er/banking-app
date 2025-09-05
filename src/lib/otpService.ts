// src/lib/otpService.ts
import crypto from 'crypto';
import { sendTransactionEmail } from './mail';

// OTP Configuration
const OTP_CONFIG = {
  LENGTH: 6,
  EXPIRY_MINUTES: 10,
  MAX_ATTEMPTS: 3,
  RESEND_COOLDOWN_SECONDS: 60,
  BLOCK_DURATION_MINUTES: 30
};

// OTP Types for different actions
export enum OTPType {
  LOGIN = 'login',
  TRANSFER = 'transfer',
  PROFILE_UPDATE = 'profile_update',
  CARD_APPLICATION = 'card_application',
  PASSWORD_RESET = 'password_reset',
  TRANSACTION_APPROVAL = 'transaction_approval'
}

// OTP Storage Interface
interface OTPRecord {
  code: string;
  type: OTPType;
  userId: string;
  email: string;
  phone?: string;
  expiresAt: Date;
  attempts: number;
  verified: boolean;
  metadata?: any;
  createdAt: Date;
  lastAttemptAt?: Date;
  ipAddress?: string;
}

// In production, use Redis or database. For now, using in-memory storage
const otpStorage = new Map<string, OTPRecord>();
const blockedUsers = new Map<string, Date>();

/**
 * Generate a random OTP code
 */
export function generateOTPCode(length: number = OTP_CONFIG.LENGTH): string {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  
  return otp;
}

/**
 * Generate a secure OTP token for URL-based verification
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create and store OTP
 */
export async function createOTP(
  userId: string,
  email: string,
  type: OTPType,
  metadata?: any,
  phone?: string
): Promise<{ success: boolean; code?: string; token?: string; error?: string }> {
  try {
    // Check if user is blocked
    if (isUserBlocked(userId)) {
      const blockExpiry = blockedUsers.get(userId);
      const minutesLeft = Math.ceil((blockExpiry!.getTime() - Date.now()) / 60000);
      return {
        success: false,
        error: `Too many failed attempts. Please try again in ${minutesLeft} minutes.`
      };
    }

    // Check for existing unexpired OTP
    const existingKey = `${userId}-${type}`;
    const existing = otpStorage.get(existingKey);
    
    if (existing && existing.expiresAt > new Date()) {
      // Check resend cooldown
      const secondsSinceCreated = (Date.now() - existing.createdAt.getTime()) / 1000;
      if (secondsSinceCreated < OTP_CONFIG.RESEND_COOLDOWN_SECONDS) {
        const waitTime = Math.ceil(OTP_CONFIG.RESEND_COOLDOWN_SECONDS - secondsSinceCreated);
        return {
          success: false,
          error: `Please wait ${waitTime} seconds before requesting a new code.`
        };
      }
    }

    // Generate new OTP
    const code = generateOTPCode();
    const token = generateSecureToken();
    
    const otpRecord: OTPRecord = {
      code,
      type,
      userId,
      email,
      phone,
      expiresAt: new Date(Date.now() + OTP_CONFIG.EXPIRY_MINUTES * 60000),
      attempts: 0,
      verified: false,
      metadata,
      createdAt: new Date(),
      ipAddress: metadata?.ipAddress
    };

    // Store OTP
    otpStorage.set(existingKey, otpRecord);
    
    // Also store by token for URL-based verification
    otpStorage.set(`token-${token}`, otpRecord);

    // Send OTP via email or SMS
    await sendOTP(email, code, type, phone);

    return {
      success: true,
      code: process.env.NODE_ENV === 'development' ? code : undefined, // Only return code in dev
      token
    };
  } catch (error: any) {
    console.error('Failed to create OTP:', error);
    return {
      success: false,
      error: 'Failed to generate verification code'
    };
  }
}

/**
 * Verify OTP code
 */
export async function verifyOTP(
  userId: string,
  code: string,
  type: OTPType
): Promise<{ success: boolean; error?: string }> {
  try {
    const key = `${userId}-${type}`;
    const otpRecord = otpStorage.get(key);

    if (!otpRecord) {
      return {
        success: false,
        error: 'No verification code found. Please request a new one.'
      };
    }

    // Check if already verified
    if (otpRecord.verified) {
      return {
        success: false,
        error: 'This code has already been used.'
      };
    }

    // Check expiry
    if (otpRecord.expiresAt < new Date()) {
      otpStorage.delete(key);
      return {
        success: false,
        error: 'Verification code has expired. Please request a new one.'
      };
    }

    // Update attempt count
    otpRecord.attempts++;
    otpRecord.lastAttemptAt = new Date();

    // Check if code matches
    if (otpRecord.code !== code) {
      // Check max attempts
      if (otpRecord.attempts >= OTP_CONFIG.MAX_ATTEMPTS) {
        // Block user
        blockUser(userId);
        otpStorage.delete(key);
        return {
          success: false,
          error: `Too many failed attempts. Account temporarily blocked for ${OTP_CONFIG.BLOCK_DURATION_MINUTES} minutes.`
        };
      }

      const remainingAttempts = OTP_CONFIG.MAX_ATTEMPTS - otpRecord.attempts;
      return {
        success: false,
        error: `Invalid code. ${remainingAttempts} attempt(s) remaining.`
      };
    }

    // Mark as verified
    otpRecord.verified = true;
    otpStorage.delete(key); // Remove after successful verification

    return { success: true };
  } catch (error: any) {
    console.error('Failed to verify OTP:', error);
    return {
      success: false,
      error: 'Verification failed'
    };
  }
}

/**
 * Verify OTP token (for URL-based verification)
 */
export async function verifyOTPToken(
  token: string
): Promise<{ success: boolean; userId?: string; type?: OTPType; error?: string }> {
  try {
    const key = `token-${token}`;
    const otpRecord = otpStorage.get(key);

    if (!otpRecord) {
      return {
        success: false,
        error: 'Invalid or expired verification link.'
      };
    }

    // Check expiry
    if (otpRecord.expiresAt < new Date()) {
      otpStorage.delete(key);
      return {
        success: false,
        error: 'Verification link has expired.'
      };
    }

    // Mark as verified
    otpRecord.verified = true;
    otpStorage.delete(key);

    return {
      success: true,
      userId: otpRecord.userId,
      type: otpRecord.type
    };
  } catch (error: any) {
    console.error('Failed to verify OTP token:', error);
    return {
      success: false,
      error: 'Verification failed'
    };
  }
}

/**
 * Send OTP via email or SMS
 */
async function sendOTP(
  email: string,
  code: string,
  type: OTPType,
  phone?: string
): Promise<void> {
  // Get appropriate message based on type
  const messages = {
    [OTPType.LOGIN]: 'Login Verification',
    [OTPType.TRANSFER]: 'Transfer Authorization',
    [OTPType.PROFILE_UPDATE]: 'Profile Update Verification',
    [OTPType.CARD_APPLICATION]: 'Credit Card Application',
    [OTPType.PASSWORD_RESET]: 'Password Reset',
    [OTPType.TRANSACTION_APPROVAL]: 'Transaction Approval'
  };

  const subject = `${messages[type]} - Verification Code`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 10px 10px; }
        .otp-code { background: white; border: 2px solid #667eea; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center; }
        .otp-code h2 { margin: 0; color: #667eea; font-size: 36px; letter-spacing: 5px; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Verification Required</h1>
          <p>${messages[type]}</p>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>You requested a verification code for ${messages[type].toLowerCase()}. Please use the code below to complete your action:</p>
          
          <div class="otp-code">
            <h2>${code}</h2>
            <p style="margin: 10px 0 0; color: #666; font-size: 14px;">
              This code expires in ${OTP_CONFIG.EXPIRY_MINUTES} minutes
            </p>
          </div>
          
          <div class="warning">
            <strong>Security Notice:</strong><br>
            • Never share this code with anyone<br>
            • Our staff will never ask for this code<br>
            • If you didn't request this, please ignore this email
          </div>
          
          <p>For your security, this code can only be used once and will expire at ${new Date(Date.now() + OTP_CONFIG.EXPIRY_MINUTES * 60000).toLocaleTimeString()}.</p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>© ${new Date().getFullYear()} Your Bank. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Fixed: Remove customHTML and send it as a separate parameter or handle differently
  await sendTransactionEmail(email, {
    name: 'Customer',
    transaction: {
      type: 'otp',
      description: subject
      // Removed customHTML as it's not part of TxLike interface
    }
  });

  // If phone number provided and SMS service configured, send SMS
  if (phone && process.env.TWILIO_ACCOUNT_SID) {
    // await sendSMS(phone, `Your ${messages[type]} code is: ${code}. Expires in ${OTP_CONFIG.EXPIRY_MINUTES} minutes.`);
  }
}

/**
 * Block user after max failed attempts
 */
function blockUser(userId: string): void {
  const blockUntil = new Date(Date.now() + OTP_CONFIG.BLOCK_DURATION_MINUTES * 60000);
  blockedUsers.set(userId, blockUntil);
}

/**
 * Check if user is blocked
 */
function isUserBlocked(userId: string): boolean {
  const blockExpiry = blockedUsers.get(userId);
  
  if (!blockExpiry) return false;
  
  if (blockExpiry > new Date()) {
    return true;
  }
  
  // Unblock if time has passed
  blockedUsers.delete(userId);
  return false;
}

/**
 * Clean up expired OTPs (run periodically)
 */
export function cleanupExpiredOTPs(): void {
  const now = new Date();
  
  for (const [key, record] of otpStorage.entries()) {
    if (record.expiresAt < now) {
      otpStorage.delete(key);
    }
  }
  
  for (const [userId, expiry] of blockedUsers.entries()) {
    if (expiry < now) {
      blockedUsers.delete(userId);
    }
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredOTPs, 5 * 60 * 1000);
}