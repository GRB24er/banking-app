// src/lib/mail.ts
import nodemailer, { Transporter, SentMessageInfo } from "nodemailer";

/** ==============================
 * SMTP CONFIGURATION - HOSTINGER
 * ============================== */
const SMTP_HOST = process.env.SMTP_HOST || "smtp.hostinger.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "465", 10);
const SMTP_SECURE = process.env.SMTP_SECURE === "false" ? false : true;
const SMTP_USER = process.env.SMTP_USER || "support@horizonglobalcapital.com";
const SMTP_PASS = process.env.SMTP_PASSWORD || "Valmont15#Benjamin2010";

// Validate SMTP configuration
if (!process.env.SMTP_PASSWORD && process.env.NODE_ENV === "production") {
  console.error("[mail] WARNING: SMTP_PASSWORD environment variable is not set!");
}

// Email configuration
const FROM_DISPLAY = `ZentriBank Security <${SMTP_USER}>`;
const ENVELOPE_FROM = SMTP_USER;
const REPLY_TO = process.env.REPLY_TO_EMAIL || SMTP_USER;
const LIST_UNSUBSCRIBE = `<mailto:${SMTP_USER}?subject=Unsubscribe>`;

// Connection pool settings
const POOL_CONFIG = {
  pool: true,
  maxConnections: parseInt(process.env.SMTP_MAX_CONNECTIONS || "3", 10),
  maxMessages: parseInt(process.env.SMTP_MAX_MESSAGES || "100", 10),
  rateDelta: 1000,
  rateLimit: parseInt(process.env.SMTP_RATE_LIMIT || "5", 10),
};

// Timeout settings
const TIMEOUT_CONFIG = {
  connectionTimeout: parseInt(process.env.SMTP_CONNECTION_TIMEOUT || "20000", 10),
  greetingTimeout: parseInt(process.env.SMTP_GREETING_TIMEOUT || "20000", 10),
  socketTimeout: parseInt(process.env.SMTP_SOCKET_TIMEOUT || "40000", 10),
};

let cachedTransporter: Transporter | null = null;

async function getTransporter(): Promise<Transporter> {
  if (cachedTransporter) return cachedTransporter;

  cachedTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    ...POOL_CONFIG,
    ...TIMEOUT_CONFIG,
    logger: process.env.NODE_ENV === "development",
    debug: process.env.NODE_ENV === "development",
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === "production",
      minVersion: "TLSv1.2",
    },
  });

  if (process.env.NODE_ENV === "development" || process.env.VERIFY_SMTP === "true") {
    try {
      if (cachedTransporter) {
        await cachedTransporter.verify();
        console.log("[mail] SMTP connection verified successfully");
      }
    } catch (err) {
      console.error("[mail] SMTP verification failed:", err);
      if (process.env.NODE_ENV === "production" && process.env.VERIFY_SMTP === "true") {
        throw new Error(`SMTP configuration error: ${err}`);
      }
    }
  }
  
  return cachedTransporter as Transporter;
}

/** ==============================
 * Local transaction type + helpers
 * ============================== */
type TxLike = {
  _id?: any;
  userId?: any;
  reference?: string;
  type?: string;
  currency?: string;
  amount?: number | string;
  description?: string;
  status?: string;
  date?: Date | string;
  accountType?: "checking" | "savings" | "investment" | string;
  posted?: boolean;
  postedAt?: Date | string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  channel?: string;
  origin?: string;
  editedDateByAdmin?: boolean;
  toObject?: () => any;
};

type NormalizedTx = {
  _id: string;
  userId: string;
  reference: string;
  type: string;
  currency: string;
  amount: number;
  description: string;
  status: string;
  date: Date;
  accountType: "checking" | "savings" | "investment" | string;
  posted: boolean;
  postedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  channel?: string;
  origin?: string;
  editedDateByAdmin: boolean;
};

function toDate(val: any, fallback = new Date()): Date {
  const d = val instanceof Date ? val : new Date(val);
  return isNaN(d.getTime()) ? fallback : d;
}

function normalizeTx(input: TxLike): NormalizedTx {
  const raw = typeof input?.toObject === "function" ? (input.toObject() as TxLike) : input;

  return {
    _id: String(raw._id ?? ""),
    userId: String(raw.userId ?? ""),
    reference: String(raw.reference ?? ""),
    type: String(raw.type ?? "deposit"),
    currency: String(raw.currency ?? "USD"),
    amount:
      typeof raw.amount === "string"
        ? Number(raw.amount.replace(/[^\d.-]/g, "")) || 0
        : Number(raw.amount ?? 0),
    description: String(raw.description ?? "Bank transaction"),
    status: String(raw.status ?? "pending"),
    date: toDate(raw.date),
    accountType: (raw.accountType as any) ?? "checking",
    posted: Boolean(raw.posted ?? false),
    postedAt: raw.postedAt ? toDate(raw.postedAt) : null,
    createdAt: toDate(raw.createdAt),
    updatedAt: toDate(raw.updatedAt),
    channel: raw.channel,
    origin: raw.origin,
    editedDateByAdmin: Boolean(raw.editedDateByAdmin ?? false),
  };
}

function statusLabel(status: string) {
  const s = (status || "").toLowerCase();
  if (s === "approved" || s === "completed") return "Completed";
  if (s === "pending_verification") return "Pending - Verification";
  if (s === "rejected") return "Rejected";
  return "Pending";
}

function isCredit(type: string) {
  const t = (type || "").toLowerCase();
  return t.includes("deposit") || t.includes("transfer-in") || t.includes("interest") || t.includes("adjustment-credit");
}

function isDebit(type: string) {
  const t = (type || "").toLowerCase();
  return t.includes("withdraw") || t.includes("transfer-out") || t.includes("fee") || t.includes("adjustment-debit");
}

function fmtAmount(n: number, currency = "USD") {
  try {
    return new Intl.NumberFormat(undefined, { 
      style: "currency", 
      currency, 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).format(Number(n || 0));
  } catch {
    return new Intl.NumberFormat(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).format(Number(n || 0));
  }
}

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleString();
}

/** ==============================
 * CORE SENDER with RETRIES
 * ============================== */
const TRANSIENT_CODES = new Set([
  "ETIMEDOUT", 
  "ECONNRESET", 
  "ECONNREFUSED", 
  "ESOCKET", 
  "EPIPE",
  "ENOTFOUND",
  "EHOSTUNREACH"
]);

async function sendWithRetry(
  options: Parameters<Transporter["sendMail"]>[0],
  maxAttempts = 3
): Promise<SentMessageInfo & { failed?: boolean; error?: string; skipped?: boolean }> {
  if (!SMTP_PASS) {
    const errorMsg = "[mail] SMTP password not configured. Set SMTP_PASSWORD environment variable.";
    console.error(errorMsg);
    
    if (process.env.NODE_ENV === "production") {
      throw new Error(errorMsg);
    }
    
    return {
      accepted: [],
      rejected: [],
      envelope: { from: ENVELOPE_FROM, to: options.to as any },
      messageId: "SKIPPED-NO-CONFIG-" + Date.now(),
      skipped: true,
      response: "Email skipped - SMTP not configured",
    } as any;
  }

  const transporter = await getTransporter();
  let attempt = 0;
  let lastErr: any = null;

  while (attempt < maxAttempts) {
    attempt++;
    try {
      const info = await transporter.sendMail(options);
      console.log(`[mail] Email sent successfully (attempt ${attempt}/${maxAttempts}): messageId=${info.messageId}`);
      return info;
    } catch (err: any) {
      lastErr = err;
      const code = err?.code || err?.responseCode || "";
      const message = err?.message || String(err);
      const transient = TRANSIENT_CODES.has(code) || 
                       /timed?out/i.test(message) || 
                       /connection.*closed/i.test(message);

      console.warn(`[mail] Send attempt ${attempt} failed:`, {
        code,
        message: message.substring(0, 200),
        transient
      });

      if (/EAUTH|ENVELOPE|EENVELOPE|EADDR/i.test(code) || 
          /auth/i.test(message) || 
          /invalid.*recipient/i.test(message) ||
          /user.*not.*found/i.test(message)) {
        console.error("[mail] Permanent error detected, not retrying");
        break;
      }

      if (attempt < maxAttempts && transient) {
        const backoff = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.log(`[mail] Retrying in ${backoff}ms...`);
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }
      break;
    }
  }

  console.error("[mail] Final failure after all attempts:", lastErr?.code || "", lastErr?.message || lastErr);
  
  return {
    accepted: [],
    rejected: [options.to].flat(),
    envelope: { from: ENVELOPE_FROM, to: options.to as any },
    messageId: "FAILED-" + Date.now(),
    failed: true,
    error: lastErr?.message || String(lastErr),
    response: lastErr?.response || undefined,
  } as any;
}

/** ==============================
 * PUBLIC APIs - ALL EXPORTS
 * ============================== */

// 1) Generic email sender - MAIN FUNCTION FOR OTP AND OTHER SERVICES
export async function sendEmail(options: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{ filename: string; content: Buffer }>;
}): Promise<any> {
  const { to, subject, html, text, attachments } = options;
  
  const recipientList = Array.isArray(to) ? to : [to].filter(Boolean);
  if (recipientList.length === 0) {
    console.warn("[mail] No recipients provided");
    return { 
      accepted: [], 
      rejected: [], 
      skipped: true, 
      messageId: "SKIPPED-NO-RECIPIENT-" + Date.now() 
    };
  }

  return sendWithRetry(
    {
      from: FROM_DISPLAY,
      replyTo: REPLY_TO,
      envelope: { from: ENVELOPE_FROM, to: recipientList },
      to: recipientList,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''),
      html,
      attachments,
      headers: { 
        "List-Unsubscribe": LIST_UNSUBSCRIBE,
        "X-Priority": "1",
      },
    },
    3
  );
}

// 2) Transaction event email
export async function sendTransactionEmail(
  to: string | string[],
  args: { name?: string; transaction: TxLike }
) {
  const recipientList = Array.isArray(to) ? to : [to].filter(Boolean);
  if (recipientList.length === 0) {
    console.warn("[mail] No recipients provided");
    return { 
      accepted: [], 
      rejected: [], 
      skipped: true as const, 
      messageId: "SKIPPED-NO-RECIPIENT-" + Date.now() 
    };
  }

  const tx = normalizeTx(args.transaction);
  const label = statusLabel(tx.status);
  const signedAmount = (isCredit(tx.type) ? "+" : isDebit(tx.type) ? "-" : "") + 
                      fmtAmount(tx.amount, tx.currency);
  const subject = `Transaction ${label}: ${tx.description || tx.type} ${signedAmount}`;
  const greetingName = args.name || "Customer";

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin:0; padding:20px; background-color:#0a0a0f;">
    <div style="max-width:600px; margin:0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius:16px; padding:32px; border: 1px solid #1e2130;">
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height:1.6; color:#ffffff">
        <div style="text-align:center; margin-bottom:24px; padding-bottom:24px; border-bottom:2px solid #D4AF37;">
          <span style="font-size:24px; font-weight:700; color:#D4AF37;">ZentriBank</span>
        </div>
        <h2 style="margin:0 0 8px 0; color:#ffffff;">Hi ${greetingName},</h2>
        <p style="margin:0 0 16px 0; color:#8b8ca5;">A recent transaction on your account is now <strong style="color:#ffffff;">${label}</strong>.</p>
        
        <table style="border-collapse:collapse; width:100%; margin:24px 0; background:#0f1117; border-radius:12px; overflow:hidden;">
          <tr>
            <td style="padding:14px 16px; color:#8b8ca5; border-bottom:1px solid #1e2130;">Reference</td>
            <td style="padding:14px 16px; border-bottom:1px solid #1e2130; color:#ffffff;">${tx.reference || String(tx._id)}</td>
          </tr>
          <tr>
            <td style="padding:14px 16px; color:#8b8ca5; border-bottom:1px solid #1e2130;">Description</td>
            <td style="padding:14px 16px; border-bottom:1px solid #1e2130; color:#ffffff;">${tx.description}</td>
          </tr>
          <tr>
            <td style="padding:14px 16px; color:#8b8ca5; border-bottom:1px solid #1e2130;">Type</td>
            <td style="padding:14px 16px; border-bottom:1px solid #1e2130; text-transform:capitalize; color:#ffffff;">${tx.type}</td>
          </tr>
          <tr>
            <td style="padding:14px 16px; color:#8b8ca5; border-bottom:1px solid #1e2130;">Amount</td>
            <td style="padding:14px 16px; border-bottom:1px solid #1e2130; font-weight:700; font-size:18px; color:${isCredit(tx.type) ? '#22c55e' : '#ef4444'};">${signedAmount}</td>
          </tr>
          <tr>
            <td style="padding:14px 16px; color:#8b8ca5; border-bottom:1px solid #1e2130;">Status</td>
            <td style="padding:14px 16px; border-bottom:1px solid #1e2130; color:#ffffff;">
              <span style="display:inline-block; padding:4px 12px; background:${label === 'Completed' ? 'rgba(34,197,94,0.1)' : label === 'Rejected' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)'}; color:${label === 'Completed' ? '#22c55e' : label === 'Rejected' ? '#ef4444' : '#f59e0b'}; border-radius:20px; font-size:12px; font-weight:600;">
                ${label}
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 16px; color:#8b8ca5; border-bottom:1px solid #1e2130;">Date</td>
            <td style="padding:14px 16px; border-bottom:1px solid #1e2130; color:#ffffff;">${fmtDate(tx.date)}</td>
          </tr>
          <tr>
            <td style="padding:14px 16px; color:#8b8ca5;">Account</td>
            <td style="padding:14px 16px; text-transform:capitalize; color:#ffffff;">${tx.accountType}</td>
          </tr>
        </table>
        
        <div style="margin-top:32px; padding-top:24px; border-top:1px solid #1e2130;">
          <p style="margin:0; color:#8b8ca5; font-size:14px;">
            If you did not authorize this activity, please contact support immediately.
          </p>
        </div>
        <div style="margin-top:24px; text-align:center;">
          <p style="color:#3b82f6; font-size:12px; margin:0;">© ${new Date().getFullYear()} ZentriBank. All rights reserved.</p>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;

  const text = [
    `${greetingName},`,
    ``,
    `A recent transaction on your account is now ${label}.`,
    ``,
    `Reference: ${tx.reference || String(tx._id)}`,
    `Description: ${tx.description}`,
    `Type: ${tx.type}`,
    `Amount: ${signedAmount}`,
    `Status: ${label}`,
    `Date: ${fmtDate(tx.date)}`,
    `Account: ${tx.accountType}`,
    ``,
    `If you did not authorize this activity, please contact support immediately.`,
  ].join("\n");

  return sendWithRetry(
    {
      from: FROM_DISPLAY,
      replyTo: REPLY_TO,
      envelope: { from: ENVELOPE_FROM, to: recipientList },
      to: recipientList,
      subject,
      text,
      html,
      headers: {
        "List-Unsubscribe": LIST_UNSUBSCRIBE,
        "X-Transaction-Reference": tx.reference || String(tx._id),
        "X-Transaction-Type": String(tx.type),
        "X-Transaction-Status": label,
        "X-Priority": "2",
      },
    },
    3
  );
}

// 3) Welcome email
export async function sendWelcomeEmail(to: string, opts?: any) {
  try {
    const name = (opts?.name as string) || "Customer";
    const subject = "Welcome to ZentriBank";
    
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0; padding:20px; background-color:#0a0a0f;">
      <div style="max-width:600px; margin:0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius:16px; padding:32px; border: 1px solid #1e2130;">
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height:1.6; color:#ffffff">
          <div style="text-align:center; margin-bottom:24px; padding-bottom:24px; border-bottom:2px solid #D4AF37;">
            <span style="font-size:24px; font-weight:700; color:#D4AF37;">ZentriBank</span>
          </div>
          <h1 style="margin:0 0 24px 0; color:#ffffff; font-size:28px;">Welcome to ZentriBank!</h1>
          <p style="font-size:16px; color:#8b8ca5;">Hi ${name},</p>
          <p style="font-size:16px; color:#8b8ca5;">Your online banking profile has been created successfully.</p>
          <div style="margin-top:32px; padding-top:24px; border-top:1px solid #1e2130;">
            <p style="margin:0; color:#8b8ca5; font-size:14px;">
              Best regards,<br>
              The ZentriBank Team
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;
    
    const text = `Hi ${name},\n\nWelcome to ZentriBank!\n\nYour online banking profile has been created successfully.\n\nBest regards,\nThe ZentriBank Team`;
    
    return sendWithRetry(
      {
        from: FROM_DISPLAY,
        replyTo: REPLY_TO,
        envelope: { from: ENVELOPE_FROM, to: [to] },
        to,
        subject,
        text,
        html,
        headers: { 
          "List-Unsubscribe": LIST_UNSUBSCRIBE,
          "X-Priority": "3",
        },
      },
      3
    );
  } catch (error) {
    console.error("[mail] sendWelcomeEmail error:", error);
    return {
      accepted: [],
      rejected: [to],
      messageId: "FAILED-" + Date.now(),
      failed: true,
      error: String(error),
    } as any;
  }
}

// 4) Bank statement email
export async function sendBankStatementEmail(
  to: string,
  optsOrBuffer?: any,
  filename?: string,
  name?: string,
  periodStart?: any,
  periodEnd?: any
) {
  let attachment: { filename: string; content: any } | undefined;
  let periodText = "";
  let displayName = name || "Customer";

  if (optsOrBuffer && (optsOrBuffer instanceof Buffer || typeof (optsOrBuffer as any)?.byteLength === "number")) {
    attachment = { filename: filename || "statement.pdf", content: optsOrBuffer };
    if (periodStart && periodEnd) {
      periodText = `for ${new Date(periodStart).toLocaleDateString()} - ${new Date(periodEnd).toLocaleDateString()}`;
    }
  } else if (optsOrBuffer && typeof optsOrBuffer === "object") {
    displayName = optsOrBuffer.name || displayName;
    periodText = optsOrBuffer.periodText || periodText;
    if (optsOrBuffer.attachmentBuffer) {
      attachment = {
        filename: optsOrBuffer.attachmentFilename || "statement.pdf",
        content: optsOrBuffer.attachmentBuffer,
      };
    }
  }

  const subject = `Your account statement ${periodText || ""}`.trim();
  const html = `<h2>Account Statement</h2><p>Hi ${displayName},</p><p>Your account statement ${periodText || ""} is attached.</p>`;
  const text = `Hi ${displayName},\n\nYour account statement ${periodText || ""} is attached.\n\nBest regards,\nThe ZentriBank Team`;

  return sendWithRetry(
    {
      from: FROM_DISPLAY,
      replyTo: REPLY_TO,
      envelope: { from: ENVELOPE_FROM, to: [to] },
      to,
      subject,
      text,
      html,
      attachments: attachment ? [attachment] : undefined,
      headers: { 
        "List-Unsubscribe": LIST_UNSUBSCRIBE,
        "X-Priority": "3",
      },
    },
    3
  );
}

// 5) Simple utility for ad-hoc messages
export async function sendSimpleEmail(
  to: string | string[],
  subject: string,
  text: string,
  html?: string
) {
  const recipientList = Array.isArray(to) ? to : [to].filter(Boolean);
  if (recipientList.length === 0) {
    return { 
      accepted: [], 
      rejected: [], 
      skipped: true as const, 
      messageId: "SKIPPED-NO-RECIPIENT-" + Date.now() 
    };
  }
  
  return sendWithRetry(
    {
      from: FROM_DISPLAY,
      replyTo: REPLY_TO,
      envelope: { from: ENVELOPE_FROM, to: recipientList },
      to: recipientList,
      subject,
      text,
      html: html || `<div style="font-family: Arial, sans-serif; padding: 20px;">${text.replace(/\n/g, '<br>')}</div>`,
      headers: { 
        "List-Unsubscribe": LIST_UNSUBSCRIBE,
        "X-Priority": "3",
      },
    },
    3
  );
}

// 6) Export transporter proxy for legacy code
export const transporter = {
  async sendMail(options: Parameters<Transporter["sendMail"]>[0]) {
    try {
      const t = await getTransporter();
      return await t.sendMail(options);
    } catch (error) {
      console.error("[mail] transporter.sendMail error:", error);
      return {
        accepted: [],
        rejected: [options.to].flat(),
        messageId: "FAILED-" + Date.now(),
        failed: true,
        error: String(error),
      } as any;
    }
  },
};

// 7) Export utility to test SMTP configuration
export async function testSMTPConnection(): Promise<boolean> {
  try {
    const transporter = await getTransporter();
    await transporter.verify();
    console.log("[mail] SMTP test successful");
    return true;
  } catch (error) {
    console.error("[mail] SMTP test failed:", error);
    return false;
  }
}

const mailService = {
  sendEmail,
  sendTransactionEmail,
  sendWelcomeEmail,
  sendBankStatementEmail,
  sendSimpleEmail,
  testSMTPConnection,
  transporter
};

export default mailService;