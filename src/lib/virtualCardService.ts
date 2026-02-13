// src/lib/virtualCardService.ts
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import { notifyAdmin } from '@/lib/adminNotifications';
import mail from '@/lib/mail';
import crypto from 'crypto';

// ============================================
// VIRTUAL CARD MODEL
// ============================================
const VirtualCardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  userEmail: { type: String, required: true },
  userName: { type: String, required: true },
  
  // Card Details (encrypted)
  cardNumber: { type: String }, // Encrypted, only set by admin
  cardNumberLast4: { type: String }, // Last 4 digits for display
  expiryMonth: { type: String },
  expiryYear: { type: String },
  cvv: { type: String }, // Encrypted
  cardholderName: { type: String },
  
  // Card Settings
  cardType: { 
    type: String, 
    enum: ['visa', 'mastercard'], 
    default: 'visa' 
  },
  cardTier: { 
    type: String, 
    enum: ['standard', 'gold', 'platinum', 'black'],
    default: 'standard'
  },
  currency: { type: String, default: 'USD' },
  
  // Limits
  spendingLimit: { type: Number, default: 5000 },
  dailyLimit: { type: Number, default: 1000 },
  monthlyLimit: { type: Number, default: 10000 },
  currentMonthSpent: { type: Number, default: 0 },
  currentDaySpent: { type: Number, default: 0 },
  lastSpendReset: { type: Date, default: Date.now },
  
  // Status
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'active', 'frozen', 'expired', 'cancelled', 'rejected'],
    default: 'pending',
    index: true
  },
  
  // Request Details
  requestedAt: { type: Date, default: Date.now },
  purpose: { type: String },
  
  // Admin Actions
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  processedAt: { type: Date },
  activatedAt: { type: Date },
  rejectionReason: { type: String },
  adminNotes: { type: String },
  
  // Security
  isRevealed: { type: Boolean, default: false },
  revealCount: { type: Number, default: 0 },
  lastRevealedAt: { type: Date },
  revealToken: { type: String }, // One-time reveal token
  revealTokenExpiry: { type: Date },
  
  // Card Reference
  cardReference: { type: String, unique: true },
  
  // Billing Address
  billingAddress: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
  },
  
}, { timestamps: true });

// Generate card reference
VirtualCardSchema.pre('save', async function(next) {
  if (!this.cardReference) {
    const count = await mongoose.models.VirtualCard.countDocuments();
    const year = new Date().getFullYear();
    this.cardReference = `HGC-VC-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

const VirtualCard = mongoose.models.VirtualCard || mongoose.model('VirtualCard', VirtualCardSchema);

// ============================================
// ENCRYPTION HELPERS
// ============================================
const ENCRYPTION_KEY = process.env.CARD_ENCRYPTION_KEY || 'hgc-default-encryption-key-32ch';
const IV_LENGTH = 16;

function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string): string {
  try {
    const parts = text.split(':');
    const iv = Buffer.from(parts.shift()!, 'hex');
    const encryptedText = Buffer.from(parts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch {
    return '';
  }
}

// ============================================
// CARD TIERS CONFIG
// ============================================
export const CARD_TIERS = {
  standard: {
    name: 'Standard Card',
    color: '#64748b',
    dailyLimit: 1000,
    monthlyLimit: 10000,
    spendingLimit: 5000,
    fee: 0,
  },
  gold: {
    name: 'Gold Card',
    color: '#D4AF37',
    dailyLimit: 5000,
    monthlyLimit: 50000,
    spendingLimit: 25000,
    fee: 9.99,
  },
  platinum: {
    name: 'Platinum Card',
    color: '#a3a3a3',
    dailyLimit: 10000,
    monthlyLimit: 100000,
    spendingLimit: 50000,
    fee: 19.99,
  },
  black: {
    name: 'Black Card',
    color: '#1a1a1a',
    dailyLimit: 50000,
    monthlyLimit: 500000,
    spendingLimit: 250000,
    fee: 49.99,
  },
};

// ============================================
// REQUEST VIRTUAL CARD
// ============================================
export async function requestVirtualCard(
  userId: string,
  userEmail: string,
  userName: string,
  data: {
    cardType?: 'visa' | 'mastercard';
    cardTier?: 'standard' | 'gold' | 'platinum' | 'black';
    currency?: string;
    purpose?: string;
    billingAddress?: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  }
): Promise<{ success: boolean; card?: any; error?: string }> {
  try {
    await connectDB();
    
    // Check for existing pending/active cards
    const existingCard = await VirtualCard.findOne({
      userId,
      status: { $in: ['pending', 'processing', 'active'] }
    });
    
    if (existingCard) {
      if (existingCard.status === 'active') {
        return { success: false, error: 'You already have an active virtual card' };
      }
      return { success: false, error: 'You have a pending card request' };
    }
    
    const tierConfig = CARD_TIERS[data.cardTier || 'standard'];
    
    const card = await VirtualCard.create({
      userId,
      userEmail,
      userName,
      cardType: data.cardType || 'visa',
      cardTier: data.cardTier || 'standard',
      currency: data.currency || 'USD',
      purpose: data.purpose,
      billingAddress: data.billingAddress,
      spendingLimit: tierConfig.spendingLimit,
      dailyLimit: tierConfig.dailyLimit,
      monthlyLimit: tierConfig.monthlyLimit,
      status: 'pending',
      cardholderName: userName.toUpperCase(),
    });
    
    // Notify admin
    await notifyAdmin({
      type: 'incoming_transfer',
      userId,
      userEmail,
      userName,
      description: `New Virtual Card Request - ${tierConfig.name}`,
      metadata: {
        cardReference: card.cardReference,
        cardTier: data.cardTier || 'standard',
        cardType: data.cardType || 'visa',
        purpose: data.purpose,
      },
    });
    
    // Send confirmation to user
    await sendCardRequestEmail(userEmail, userName, card);
    
    return { success: true, card };
    
  } catch (error: any) {
    console.error('[VirtualCard] Request error:', error);
    return { success: false, error: error.message || 'Failed to request card' };
  }
}

// ============================================
// GET USER CARDS
// ============================================
export async function getUserCards(userId: string): Promise<any[]> {
  await connectDB();
  const cards = await VirtualCard.find({ userId }).sort({ createdAt: -1 });
  
  // Return cards without sensitive data
  return cards.map(card => ({
    _id: card._id,
    cardReference: card.cardReference,
    cardType: card.cardType,
    cardTier: card.cardTier,
    cardNumberLast4: card.cardNumberLast4,
    cardholderName: card.cardholderName,
    expiryMonth: card.expiryMonth,
    expiryYear: card.expiryYear,
    currency: card.currency,
    status: card.status,
    spendingLimit: card.spendingLimit,
    dailyLimit: card.dailyLimit,
    monthlyLimit: card.monthlyLimit,
    currentMonthSpent: card.currentMonthSpent,
    requestedAt: card.requestedAt,
    activatedAt: card.activatedAt,
    billingAddress: card.billingAddress,
    // Don't include cardNumber or CVV
  }));
}

// ============================================
// GET ALL CARD REQUESTS (ADMIN)
// ============================================
export async function getAllCardRequests(
  filters?: { status?: string }
): Promise<any[]> {
  await connectDB();
  
  const query: any = {};
  if (filters?.status) query.status = filters.status;
  
  return VirtualCard.find(query).sort({ createdAt: -1 });
}

// ============================================
// PROCESS CARD REQUEST (ADMIN)
// ============================================
export async function processCardRequest(
  cardId: string,
  adminId: string
): Promise<{ success: boolean; card?: any; error?: string }> {
  try {
    await connectDB();
    
    const card = await VirtualCard.findById(cardId);
    if (!card) {
      return { success: false, error: 'Card not found' };
    }
    
    if (card.status !== 'pending') {
      return { success: false, error: 'Card is not in pending status' };
    }
    
    card.status = 'processing';
    card.processedBy = adminId;
    card.processedAt = new Date();
    await card.save();
    
    // Notify user
    await sendCardProcessingEmail(card.userEmail, card.userName, card);
    
    return { success: true, card };
    
  } catch (error: any) {
    console.error('[VirtualCard] Process error:', error);
    return { success: false, error: error.message || 'Failed to process card' };
  }
}

// ============================================
// ACTIVATE CARD WITH DETAILS (ADMIN)
// ============================================
export async function activateCard(
  cardId: string,
  adminId: string,
  cardDetails: {
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
  }
): Promise<{ success: boolean; card?: any; error?: string }> {
  try {
    await connectDB();
    
    const card = await VirtualCard.findById(cardId);
    if (!card) {
      return { success: false, error: 'Card not found' };
    }
    
    if (card.status !== 'pending' && card.status !== 'processing') {
      return { success: false, error: 'Card cannot be activated in current status' };
    }
    
    // Validate card number
    const cleanCardNumber = cardDetails.cardNumber.replace(/\s/g, '');
    if (cleanCardNumber.length !== 16) {
      return { success: false, error: 'Invalid card number' };
    }
    
    // Encrypt and store card details
    card.cardNumber = encrypt(cleanCardNumber);
    card.cardNumberLast4 = cleanCardNumber.slice(-4);
    card.expiryMonth = cardDetails.expiryMonth;
    card.expiryYear = cardDetails.expiryYear;
    card.cvv = encrypt(cardDetails.cvv);
    card.status = 'active';
    card.activatedAt = new Date();
    card.processedBy = adminId;
    
    await card.save();
    
    // Send activation email to user
    await sendCardActivatedEmail(card.userEmail, card.userName, card);
    
    return { success: true, card };
    
  } catch (error: any) {
    console.error('[VirtualCard] Activate error:', error);
    return { success: false, error: error.message || 'Failed to activate card' };
  }
}

// ============================================
// REJECT CARD REQUEST (ADMIN)
// ============================================
export async function rejectCardRequest(
  cardId: string,
  adminId: string,
  rejectionReason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await connectDB();
    
    const card = await VirtualCard.findById(cardId);
    if (!card) {
      return { success: false, error: 'Card not found' };
    }
    
    card.status = 'rejected';
    card.rejectionReason = rejectionReason;
    card.processedBy = adminId;
    card.processedAt = new Date();
    await card.save();
    
    // Notify user
    await sendCardRejectedEmail(card.userEmail, card.userName, card);
    
    return { success: true };
    
  } catch (error: any) {
    console.error('[VirtualCard] Reject error:', error);
    return { success: false, error: error.message || 'Failed to reject card' };
  }
}

// ============================================
// GENERATE REVEAL TOKEN
// ============================================
export async function generateRevealToken(
  cardId: string,
  userId: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    await connectDB();
    
    const card = await VirtualCard.findOne({ _id: cardId, userId });
    if (!card) {
      return { success: false, error: 'Card not found' };
    }
    
    if (card.status !== 'active') {
      return { success: false, error: 'Card is not active' };
    }
    
    // Generate one-time token valid for 5 minutes
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 5 * 60 * 1000);
    
    card.revealToken = token;
    card.revealTokenExpiry = expiry;
    await card.save();
    
    return { success: true, token };
    
  } catch (error: any) {
    console.error('[VirtualCard] Generate token error:', error);
    return { success: false, error: error.message || 'Failed to generate token' };
  }
}

// ============================================
// REVEAL CARD DETAILS
// ============================================
export async function revealCardDetails(
  cardId: string,
  userId: string,
  token: string
): Promise<{ success: boolean; cardDetails?: any; error?: string }> {
  try {
    await connectDB();
    
    const card = await VirtualCard.findOne({ _id: cardId, userId });
    if (!card) {
      return { success: false, error: 'Card not found' };
    }
    
    if (card.status !== 'active') {
      return { success: false, error: 'Card is not active' };
    }
    
    // Verify token
    if (!card.revealToken || card.revealToken !== token) {
      return { success: false, error: 'Invalid reveal token' };
    }
    
    if (!card.revealTokenExpiry || new Date() > card.revealTokenExpiry) {
      return { success: false, error: 'Reveal token expired' };
    }
    
    // Decrypt card details
    const cardNumber = decrypt(card.cardNumber);
    const cvv = decrypt(card.cvv);
    
    // Clear token after use
    card.revealToken = undefined;
    card.revealTokenExpiry = undefined;
    card.isRevealed = true;
    card.revealCount += 1;
    card.lastRevealedAt = new Date();
    await card.save();
    
    return {
      success: true,
      cardDetails: {
        cardNumber: cardNumber.replace(/(\d{4})/g, '$1 ').trim(),
        cardNumberRaw: cardNumber,
        expiryMonth: card.expiryMonth,
        expiryYear: card.expiryYear,
        expiry: `${card.expiryMonth}/${card.expiryYear}`,
        cvv,
        cardholderName: card.cardholderName,
        cardType: card.cardType,
        cardTier: card.cardTier,
      },
    };
    
  } catch (error: any) {
    console.error('[VirtualCard] Reveal error:', error);
    return { success: false, error: error.message || 'Failed to reveal card' };
  }
}

// ============================================
// FREEZE/UNFREEZE CARD
// ============================================
export async function freezeCard(cardId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await connectDB();
    
    const card = await VirtualCard.findOne({ _id: cardId, userId });
    if (!card) {
      return { success: false, error: 'Card not found' };
    }
    
    if (card.status !== 'active') {
      return { success: false, error: 'Only active cards can be frozen' };
    }
    
    card.status = 'frozen';
    await card.save();
    
    return { success: true };
    
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to freeze card' };
  }
}

export async function unfreezeCard(cardId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await connectDB();
    
    const card = await VirtualCard.findOne({ _id: cardId, userId });
    if (!card) {
      return { success: false, error: 'Card not found' };
    }
    
    if (card.status !== 'frozen') {
      return { success: false, error: 'Card is not frozen' };
    }
    
    card.status = 'active';
    await card.save();
    
    return { success: true };
    
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to unfreeze card' };
  }
}

// ============================================
// CANCEL CARD
// ============================================
export async function cancelCard(cardId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await connectDB();
    
    const card = await VirtualCard.findOne({ _id: cardId, userId });
    if (!card) {
      return { success: false, error: 'Card not found' };
    }
    
    card.status = 'cancelled';
    await card.save();
    
    return { success: true };
    
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to cancel card' };
  }
}

// ============================================
// EMAIL TEMPLATES
// ============================================
async function sendCardRequestEmail(email: string, name: string, card: any): Promise<void> {
  const tierConfig = CARD_TIERS[card.cardTier as keyof typeof CARD_TIERS];
  
  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#0f172a 100%);padding:32px;text-align:center;">
              <span style="font-size:28px;font-weight:800;color:#D4AF37;">HORIZON</span>
              <div style="font-size:11px;color:#94a3b8;letter-spacing:2px;margin-top:4px;">GLOBAL CAPITAL</div>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <div style="text-align:center;margin-bottom:32px;">
                <div style="width:80px;height:80px;background:${tierConfig.color}20;border-radius:50%;margin:0 auto 16px;line-height:80px;font-size:36px;">💳</div>
                <h1 style="margin:0;font-size:24px;color:#1e293b;">Virtual Card Request Received</h1>
              </div>
              
              <p style="font-size:16px;color:#475569;line-height:1.6;">Dear ${name},</p>
              <p style="font-size:16px;color:#475569;line-height:1.6;">
                We have received your request for a ${tierConfig.name}. Our team will review and process your request shortly.
              </p>
              
              <div style="background:#f8fafc;border-radius:12px;padding:24px;margin:24px 0;">
                <h3 style="margin:0 0 16px;font-size:14px;color:#64748b;text-transform:uppercase;">Request Details</h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:8px 0;color:#64748b;">Reference:</td>
                    <td style="padding:8px 0;text-align:right;color:#1e293b;font-weight:600;font-family:monospace;">${card.cardReference}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#64748b;">Card Type:</td>
                    <td style="padding:8px 0;text-align:right;color:#1e293b;font-weight:600;text-transform:uppercase;">${card.cardType}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#64748b;">Card Tier:</td>
                    <td style="padding:8px 0;text-align:right;">
                      <span style="background:${tierConfig.color}20;color:${tierConfig.color};padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">${tierConfig.name}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#64748b;">Daily Limit:</td>
                    <td style="padding:8px 0;text-align:right;color:#1e293b;font-weight:600;">$${tierConfig.dailyLimit.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#64748b;">Monthly Limit:</td>
                    <td style="padding:8px 0;text-align:right;color:#1e293b;font-weight:600;">$${tierConfig.monthlyLimit.toLocaleString()}</td>
                  </tr>
                </table>
              </div>
              
              <div style="background:#fef3c7;border-radius:8px;padding:16px;margin:24px 0;">
                <p style="margin:0;font-size:14px;color:#b45309;">
                  ⏱ <strong>Processing Time:</strong> Your card will be reviewed and activated within 1-2 business days.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;padding:24px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#64748b;">© ${new Date().getFullYear()} Horizon Global Capital Ltd.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await (mail as any).sendEmail({
    to: email,
    subject: `Virtual Card Request Received - ${card.cardReference}`,
    html,
  });
}

async function sendCardProcessingEmail(email: string, name: string, card: any): Promise<void> {
  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#0f172a 100%);padding:32px;text-align:center;">
              <span style="font-size:28px;font-weight:800;color:#D4AF37;">HORIZON</span>
              <div style="font-size:11px;color:#94a3b8;letter-spacing:2px;margin-top:4px;">GLOBAL CAPITAL</div>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;text-align:center;">
              <div style="width:80px;height:80px;background:#3b82f620;border-radius:50%;margin:0 auto 16px;line-height:80px;font-size:36px;">⚙️</div>
              <h1 style="margin:0 0 16px;font-size:24px;color:#1e293b;">Your Card is Being Processed</h1>
              <p style="font-size:16px;color:#475569;line-height:1.6;">
                Dear ${name}, your virtual card request (${card.cardReference}) is now being processed. You will receive your card details shortly.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;padding:24px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#64748b;">© ${new Date().getFullYear()} Horizon Global Capital Ltd.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await (mail as any).sendEmail({
    to: email,
    subject: `Virtual Card Processing - ${card.cardReference}`,
    html,
  });
}

async function sendCardActivatedEmail(email: string, name: string, card: any): Promise<void> {
  const tierConfig = CARD_TIERS[card.cardTier as keyof typeof CARD_TIERS];
  
  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#0f172a 100%);padding:32px;text-align:center;">
              <span style="font-size:28px;font-weight:800;color:#D4AF37;">HORIZON</span>
              <div style="font-size:11px;color:#94a3b8;letter-spacing:2px;margin-top:4px;">GLOBAL CAPITAL</div>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <div style="text-align:center;margin-bottom:32px;">
                <div style="width:80px;height:80px;background:#10b98120;border-radius:50%;margin:0 auto 16px;line-height:80px;font-size:36px;">✅</div>
                <h1 style="margin:0;font-size:24px;color:#10b981;">Your Virtual Card is Ready!</h1>
              </div>
              
              <p style="font-size:16px;color:#475569;line-height:1.6;">Dear ${name},</p>
              <p style="font-size:16px;color:#475569;line-height:1.6;">
                Great news! Your ${tierConfig.name} has been activated and is ready to use.
              </p>
              
              <!-- Card Preview -->
              <div style="background:linear-gradient(135deg,${tierConfig.color} 0%,${tierConfig.color}dd 100%);border-radius:16px;padding:24px;margin:24px 0;color:#fff;">
                <div style="display:flex;justify-content:space-between;margin-bottom:24px;">
                  <span style="font-size:12px;opacity:0.8;">VIRTUAL CARD</span>
                  <span style="font-size:14px;font-weight:600;text-transform:uppercase;">${card.cardType}</span>
                </div>
                <div style="font-size:24px;letter-spacing:4px;margin-bottom:24px;font-family:monospace;">
                  •••• •••• •••• ${card.cardNumberLast4}
                </div>
                <div style="display:flex;justify-content:space-between;">
                  <div>
                    <div style="font-size:10px;opacity:0.7;">CARD HOLDER</div>
                    <div style="font-size:14px;font-weight:600;">${card.cardholderName}</div>
                  </div>
                  <div>
                    <div style="font-size:10px;opacity:0.7;">EXPIRES</div>
                    <div style="font-size:14px;font-weight:600;">${card.expiryMonth}/${card.expiryYear}</div>
                  </div>
                </div>
              </div>
              
              <div style="background:#10b98110;border:1px solid #10b98130;border-radius:12px;padding:20px;margin:24px 0;text-align:center;">
                <p style="margin:0 0 12px;font-size:14px;color:#065f46;">
                  🔐 <strong>View Full Card Details</strong>
                </p>
                <p style="margin:0;font-size:14px;color:#047857;">
                  Log in to your dashboard and click "Reveal Card Details" to view your complete card information securely.
                </p>
              </div>
              
              <div style="background:#fef2f2;border-radius:8px;padding:16px;margin:24px 0;">
                <p style="margin:0;font-size:14px;color:#dc2626;">
                  ⚠️ <strong>Security Notice:</strong> Never share your card details with anyone. Horizon Global Capital will never ask for your full card number or CVV.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;padding:24px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#64748b;">© ${new Date().getFullYear()} Horizon Global Capital Ltd.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await (mail as any).sendEmail({
    to: email,
    subject: `🎉 Your Virtual Card is Now Active - ${card.cardReference}`,
    html,
  });
}

async function sendCardRejectedEmail(email: string, name: string, card: any): Promise<void> {
  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#0f172a 100%);padding:32px;text-align:center;">
              <span style="font-size:28px;font-weight:800;color:#D4AF37;">HORIZON</span>
              <div style="font-size:11px;color:#94a3b8;letter-spacing:2px;margin-top:4px;">GLOBAL CAPITAL</div>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h1 style="margin:0 0 24px;font-size:24px;color:#1e293b;">Virtual Card Request Update</h1>
              <p style="font-size:16px;color:#475569;line-height:1.6;">Dear ${name},</p>
              <p style="font-size:16px;color:#475569;line-height:1.6;">
                We regret to inform you that your virtual card request (${card.cardReference}) could not be approved at this time.
              </p>
              
              <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:24px 0;">
                <p style="margin:0;font-size:14px;color:#dc2626;">
                  <strong>Reason:</strong> ${card.rejectionReason}
                </p>
              </div>
              
              <p style="font-size:14px;color:#64748b;line-height:1.6;">
                You may reapply after addressing the above concerns. If you have questions, please contact our support team.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;padding:24px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#64748b;">© ${new Date().getFullYear()} Horizon Global Capital Ltd.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await (mail as any).sendEmail({
    to: email,
    subject: `Virtual Card Request Update - ${card.cardReference}`,
    html,
  });
}

export { VirtualCard, CARD_TIERS };
