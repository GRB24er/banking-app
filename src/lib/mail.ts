// src/lib/mail.ts
import nodemailer, { Transporter, SentMessageInfo } from "nodemailer";

/** ==============================
 * SMTP CONFIGURATION
 * ============================== */
const SMTP_HOST = "mail.privateemail.com";
const SMTP_PORT = 465; // SSL/TLS
const SMTP_SECURE = true;
const SMTP_USER = "support@horizongroup.it.com";
// Get password from environment variable or use a default for development
const SMTP_PASS = process.env.SMTP_PASSWORD || "Valmont15#";

// Visible From with display name:
const FROM_DISPLAY = `Horizon Group Support <${SMTP_USER}>`;
// Envelope MAIL FROM must match auth user to avoid 553
const ENVELOPE_FROM = "support@horizongroup.it.com";
const REPLY_TO = "support@horizongroup.it.com";
const LIST_UNSUBSCRIBE = "<mailto:support@horizongroup.it.com?subject=Unsubscribe>";

let cachedTransporter: Transporter | null = null;

async function getTransporter(): Promise<Transporter> {
  if (cachedTransporter) return cachedTransporter;

  cachedTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: { user: SMTP_USER, pass: SMTP_PASS },

    // Pooled connections
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 5,

    // Timeouts
    logger: process.env.NODE_ENV === 'development',
    debug: process.env.NODE_ENV === 'development',
    connectionTimeout: 20_000,
    greetingTimeout: 20_000,
    socketTimeout: 40_000,
  });

  // Only verify in development
  if (process.env.NODE_ENV === 'development') {
    try {
      await cachedTransporter.verify();
      console.log("[mail] SMTP verify OK");
    } catch (err) {
      console.warn("[mail] SMTP verify failed (continuing):", err);
    }
  }
  
  return cachedTransporter;
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
  if (s === "pending_verification") return "Pending – Verification";
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
    return new Intl.NumberFormat(undefined, { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n || 0));
  } catch {
    return new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n || 0));
  }
}
function fmtDate(d: Date | string) {
  return new Date(d).toLocaleString();
}

/** ==============================
 * CORE SENDER with RETRIES
 * ============================== */
const TRANSIENT_CODES = new Set(["ETIMEDOUT", "ECONNRESET", "ECONNREFUSED", "ESOCKET", "EPIPE"]);

async function sendWithRetry(
  options: Parameters<Transporter["sendMail"]>[0],
  maxAttempts = 3
): Promise<SentMessageInfo & { failed?: boolean; error?: string }> {
  // If SMTP is not configured properly, skip email sending
  if (SMTP_PASS === "your_actual_password_here" || !SMTP_PASS) {
    console.warn("[mail] SMTP password not configured, skipping email");
    return {
      accepted: [],
      rejected: [],
      envelope: { from: options.envelope?.from || ENVELOPE_FROM, to: options.to as any },
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
      console.log(`[mail] sent attempt ${attempt}/${maxAttempts} -> messageId=${info.messageId}`);
      return info;
    } catch (err: any) {
      lastErr = err;
      const code = err?.code || err?.responseCode || "";
      const message = err?.message || String(err);
      const transient = TRANSIENT_CODES.has(code) || /timed?out/i.test(message) || /connection.*closed/i.test(message);

      console.warn(`[mail] send attempt ${attempt} failed:`, code, message);

      // Don't retry on auth/envelope errors
      if (/EAUTH|ENVELOPE|EENVELOPE|EADDR|EHOSTUNREACH/i.test(code) || /auth/i.test(message)) {
        break;
      }

      if (attempt < maxAttempts && transient) {
        const backoff = 500 * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }
      break;
    }
  }

  console.error("[mail] FINAL FAILURE:", lastErr?.code || "", lastErr?.message || lastErr);
  // Return a "soft" failure instead of throwing
  return {
    accepted: [],
    rejected: [],
    envelope: { from: options.envelope?.from || ENVELOPE_FROM, to: options.to as any },
    messageId: "FAILED-" + Date.now(),
    failed: true,
    error: lastErr?.message || String(lastErr),
    response: (lastErr && lastErr.response) || undefined,
  } as any;
}

/** ==============================
 * PUBLIC APIs
 * ============================== */

// 1) Transaction event email
export async function sendTransactionEmail(
  to: string | string[],
  args: { name?: string; transaction: TxLike }
) {
  const recipientList = Array.isArray(to) ? to : [to].filter(Boolean);
  if (recipientList.length === 0) {
    console.warn("[mail] no recipients provided");
    return { accepted: [], rejected: [], skipped: true as const, messageId: "SKIPPED-NO-RECIPIENT-" + Date.now() };
  }

  const tx = normalizeTx(args.transaction);
  const label = statusLabel(tx.status);
  const signedAmount = (isCredit(tx.type) ? "+" : isDebit(tx.type) ? "-" : "") + fmtAmount(tx.amount, tx.currency);
  const subject = `Transaction ${label}: ${tx.description || tx.type} ${signedAmount}`;
  const greetingName = args.name || "Customer";

  const html = `
  <div style="font-family: Inter, Roboto, Helvetica, Arial, sans-serif; line-height:1.6; color:#0f172a">
    <h2 style="margin:0 0 8px 0;">${greetingName},</h2>
    <p style="margin:0 0 16px 0;">A recent transaction on your account is now <strong>${label}</strong>.</p>
    <table style="border-collapse:collapse; width:100%; max-width:560px;">
      <tr><td style="padding:8px 0; color:#64748b; width:160px;">Reference</td><td style="padding:8px 0;">${tx.reference || String(tx._id)}</td></tr>
      <tr><td style="padding:8px 0; color:#64748b;">Description</td><td style="padding:8px 0;">${tx.description}</td></tr>
      <tr><td style="padding:8px 0; color:#64748b;">Type</td><td style="padding:8px 0; text-transform:capitalize;">${tx.type}</td></tr>
      <tr><td style="padding:8px 0; color:#64748b;">Amount</td><td style="padding:8px 0; font-weight:700;">${signedAmount}</td></tr>
      <tr><td style="padding:8px 0; color:#64748b;">Status</td><td style="padding:8px 0;">${label}</td></tr>
      <tr><td style="padding:8px 0; color:#64748b;">Date</td><td style="padding:8px 0;">${fmtDate(tx.date)}</td></tr>
      <tr><td style="padding:8px 0; color:#64748b;">Account</td><td style="padding:8px 0; text-transform:capitalize;">${tx.accountType}</td></tr>
    </table>
    <p style="margin:16px 0 0 0; color:#64748b;">If you did not authorize this activity, please contact support immediately.</p>
  </div>
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
      },
    },
    3
  );
}

// 2) Welcome email - more fault tolerant
export async function sendWelcomeEmail(to: string, opts?: any) {
  try {
    const name = (opts?.name as string) || "Customer";
    const subject = "Welcome to Horizon Group";
    const text = [
      `Hi ${name},`,
      ``,
      `Welcome to Horizon Group. Your online banking profile has been created successfully.`,
      `If you have questions, reply to this email and our team will help.`,
    ].join("\n");
    const html = `
      <div style="font-family: Inter, Roboto, Helvetica, Arial, sans-serif; line-height:1.6; color:#0f172a">
        <h2 style="margin:0 0 8px 0;">Welcome, ${name}</h2>
        <p>Your Horizon Group online banking profile has been created successfully.</p>
        <p>If you have any questions, just reply to this email and our team will help.</p>
      </div>
    `;
    return sendWithRetry(
      {
        from: FROM_DISPLAY,
        replyTo: REPLY_TO,
        envelope: { from: ENVELOPE_FROM, to: [to] },
        to,
        subject,
        text,
        html,
        headers: { "List-Unsubscribe": LIST_UNSUBSCRIBE },
      },
      3
    );
  } catch (error) {
    console.error("[mail] sendWelcomeEmail error:", error);
    // Return a soft failure instead of throwing
    return {
      accepted: [],
      rejected: [],
      messageId: "FAILED-" + Date.now(),
      failed: true,
      error: String(error),
    } as any;
  }
}

// 3) Bank statement email
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
      periodText = `for ${new Date(periodStart).toLocaleDateString()} – ${new Date(periodEnd).toLocaleDateString()}`;
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
  const text = [
    `Hi ${displayName},`,
    ``,
    `Your account statement ${periodText || ""} is attached.`,
    `If you have any questions, reply to this email.`,
  ].join("\n");
  const html = `
    <div style="font-family: Inter, Roboto, Helvetica, Arial, sans-serif; line-height:1.6; color:#0f172a">
      <p>Hi ${displayName},</p>
      <p>Your account statement ${periodText || ""} is attached.</p>
      <p>If you have any questions, reply to this email.</p>
    </div>
  `;

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
      headers: { "List-Unsubscribe": LIST_UNSUBSCRIBE },
    },
    3
  );
}

// 4) Simple utility for ad-hoc messages
export async function sendSimpleEmail(
  to: string | string[],
  subject: string,
  text: string,
  html?: string
) {
  const recipientList = Array.isArray(to) ? to : [to].filter(Boolean);
  if (recipientList.length === 0) {
    return { accepted: [], rejected: [], skipped: true as const, messageId: "SKIPPED-NO-RECIPIENT-" + Date.now() };
  }
  return sendWithRetry(
    {
      from: FROM_DISPLAY,
      replyTo: REPLY_TO,
      envelope: { from: ENVELOPE_FROM, to: recipientList },
      to: recipientList,
      subject,
      text,
      html: html ?? `<pre>${text}</pre>`,
      headers: { "List-Unsubscribe": LIST_UNSUBSCRIBE },
    },
    3
  );
}

// Export transporter proxy for legacy code
export const transporter = {
  async sendMail(options: Parameters<Transporter["sendMail"]>[0]) {
    try {
      const t = await getTransporter();
      return t.sendMail(options);
    } catch (error) {
      console.error("[mail] transporter.sendMail error:", error);
      // Return soft failure for compatibility
      return {
        accepted: [],
        rejected: [],
        messageId: "FAILED-" + Date.now(),
        failed: true,
        error: String(error),
      } as any;
    }
  },
};