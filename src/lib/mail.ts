// src/lib/mail.ts
import nodemailer from "nodemailer";
import type { Transporter, SentMessageInfo } from "nodemailer";

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
const FROM_DISPLAY = `Horizon Global Capital <${SMTP_USER}>`;
const ENVELOPE_FROM = SMTP_USER;
const REPLY_TO = process.env.REPLY_TO_EMAIL || SMTP_USER;
const LIST_UNSUBSCRIBE = `<mailto:${SMTP_USER}?subject=Unsubscribe>`;
const CURRENT_YEAR = new Date().getFullYear();

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
 * BRAND DESIGN SYSTEM
 * ============================== */
const BRAND = {
  name: "Horizon Global Capital",
  tagline: "Global Vision. Local Precision.",
  colors: {
    // Primary palette
    gold: "#C9A84C",
    goldLight: "#D4B96A",
    goldDark: "#A68A3E",
    goldMuted: "rgba(201, 168, 76, 0.12)",
    goldBorder: "rgba(201, 168, 76, 0.25)",
    // Surface palette
    bgDark: "#06080D",
    bgCard: "#0C0F18",
    bgElevated: "#111623",
    bgSubtle: "#161B2A",
    bgInset: "#0A0D15",
    // Border palette
    borderDefault: "#1A2035",
    borderSubtle: "#141929",
    borderAccent: "rgba(201, 168, 76, 0.3)",
    // Text palette
    textPrimary: "#F0F0F5",
    textSecondary: "#8E92A8",
    textMuted: "#5C6078",
    textInverse: "#06080D",
    // Status palette
    success: "#2ECC71",
    successBg: "rgba(46, 204, 113, 0.08)",
    successBorder: "rgba(46, 204, 113, 0.2)",
    warning: "#F0B429",
    warningBg: "rgba(240, 180, 41, 0.08)",
    warningBorder: "rgba(240, 180, 41, 0.2)",
    danger: "#E74C3C",
    dangerBg: "rgba(231, 76, 60, 0.08)",
    dangerBorder: "rgba(231, 76, 60, 0.2)",
    info: "#3498DB",
    infoBg: "rgba(52, 152, 219, 0.08)",
    infoBorder: "rgba(52, 152, 219, 0.2)",
  },
  fonts: {
    primary: "'Georgia', 'Times New Roman', serif",
    secondary: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    mono: "'SF Mono', 'Consolas', 'Liberation Mono', 'Menlo', monospace",
  },
} as const;

/** ==============================
 * HTML EMAIL TEMPLATE ENGINE
 * ============================== */
function emailShell(content: string, options?: { preheader?: string }): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
  <title>${BRAND.name}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .fluid-padding { padding-left: 16px !important; padding-right: 16px !important; }
      .stack-column { display: block !important; width: 100% !important; }
      .responsive-heading { font-size: 22px !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:${BRAND.colors.bgDark}; -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale;">
  ${options?.preheader ? `<div style="display:none;font-size:1px;color:${BRAND.colors.bgDark};line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${options.preheader}</div>` : ""}

  <!-- OUTER WRAPPER -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:${BRAND.colors.bgDark};">
    <tr>
      <td align="center" style="padding: 32px 16px;">

        <!-- EMAIL CONTAINER -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container" style="max-width:600px; width:100%;">

          <!-- HEADER -->
          <tr>
            <td style="padding: 0 0 2px 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:${BRAND.colors.bgCard}; border-radius:16px 16px 0 0; border:1px solid ${BRAND.colors.borderDefault}; border-bottom:none;">
                <tr>
                  <td style="padding: 32px 40px 28px 40px;" class="fluid-padding">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td>
                          <!-- Logo Mark -->
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="padding-right: 14px; vertical-align: middle;">
                                <div style="width:40px; height:40px; background: linear-gradient(135deg, ${BRAND.colors.gold} 0%, ${BRAND.colors.goldDark} 100%); border-radius:10px; text-align:center; line-height:40px;">
                                  <span style="font-family:${BRAND.fonts.primary}; font-size:20px; font-weight:700; color:${BRAND.colors.textInverse};">H</span>
                                </div>
                              </td>
                              <td style="vertical-align: middle;">
                                <span style="font-family:${BRAND.fonts.primary}; font-size:18px; font-weight:700; color:${BRAND.colors.textPrimary}; letter-spacing:0.5px;">Horizon Global Capital</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Gold accent line -->
                <tr>
                  <td style="padding: 0 40px;" class="fluid-padding">
                    <div style="height:1px; background: linear-gradient(90deg, ${BRAND.colors.gold}, ${BRAND.colors.goldBorder}, transparent);"></div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BODY CONTENT -->
          <tr>
            <td style="padding: 0 0 2px 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:${BRAND.colors.bgCard}; border-left:1px solid ${BRAND.colors.borderDefault}; border-right:1px solid ${BRAND.colors.borderDefault};">
                <tr>
                  <td style="padding: 32px 40px 40px 40px;" class="fluid-padding">
                    ${content}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:${BRAND.colors.bgInset}; border-radius:0 0 16px 16px; border:1px solid ${BRAND.colors.borderDefault}; border-top:none;">
                <tr>
                  <td style="padding: 28px 40px;" class="fluid-padding">
                    <!-- Divider -->
                    <div style="height:1px; background:${BRAND.colors.borderDefault}; margin-bottom:24px;"></div>

                    <!-- Security notice -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding-right:10px; vertical-align:top;">
                          <span style="font-size:14px;">&#128274;</span>
                        </td>
                        <td>
                          <p style="margin:0; font-family:${BRAND.fonts.secondary}; font-size:11px; line-height:16px; color:${BRAND.colors.textMuted};">
                            This is an automated message from Horizon Global Capital. Never share your login credentials, OTP, or PIN with anyone. We will never ask for your password via email.
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Company info -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:20px;">
                      <tr>
                        <td align="center">
                          <p style="margin:0 0 4px 0; font-family:${BRAND.fonts.secondary}; font-size:11px; color:${BRAND.colors.textMuted};">
                            &copy; ${CURRENT_YEAR} Horizon Global Capital. All rights reserved.
                          </p>
                          <p style="margin:0; font-family:${BRAND.fonts.secondary}; font-size:11px; color:${BRAND.colors.textMuted};">
                            This email was sent to you as a registered user of Horizon Global Capital.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
        <!-- /EMAIL CONTAINER -->

      </td>
    </tr>
  </table>
  <!-- /OUTER WRAPPER -->
</body>
</html>`;
}

/** Reusable component: Section heading */
function sectionHeading(text: string): string {
  return `<h2 style="margin:0 0 8px 0; font-family:${BRAND.fonts.primary}; font-size:24px; font-weight:700; color:${BRAND.colors.textPrimary}; line-height:1.3;" class="responsive-heading">${text}</h2>`;
}

/** Reusable component: Subtitle / lead paragraph */
function leadText(text: string): string {
  return `<p style="margin:0 0 24px 0; font-family:${BRAND.fonts.secondary}; font-size:15px; line-height:24px; color:${BRAND.colors.textSecondary};">${text}</p>`;
}

/** Reusable component: Greeting */
function greeting(name: string): string {
  return `<p style="margin:0 0 20px 0; font-family:${BRAND.fonts.secondary}; font-size:15px; line-height:24px; color:${BRAND.colors.textSecondary};">Dear <strong style="color:${BRAND.colors.textPrimary}; font-weight:600;">${name}</strong>,</p>`;
}

/** Reusable component: Status badge */
function statusBadge(label: string, variant: "success" | "warning" | "danger" | "info" = "info"): string {
  const colors = {
    success: { bg: BRAND.colors.successBg, text: BRAND.colors.success, border: BRAND.colors.successBorder },
    warning: { bg: BRAND.colors.warningBg, text: BRAND.colors.warning, border: BRAND.colors.warningBorder },
    danger: { bg: BRAND.colors.dangerBg, text: BRAND.colors.danger, border: BRAND.colors.dangerBorder },
    info: { bg: BRAND.colors.infoBg, text: BRAND.colors.info, border: BRAND.colors.infoBorder },
  };
  const c = colors[variant];
  return `<span style="display:inline-block; padding:4px 14px; background:${c.bg}; color:${c.text}; border:1px solid ${c.border}; border-radius:20px; font-family:${BRAND.fonts.secondary}; font-size:11px; font-weight:700; letter-spacing:0.5px; text-transform:uppercase;">${label}</span>`;
}

/** Reusable component: Data table row */
function tableRow(label: string, value: string, options?: { highlight?: boolean; last?: boolean }): string {
  return `<tr>
    <td style="padding:14px 16px; font-family:${BRAND.fonts.secondary}; font-size:13px; color:${BRAND.colors.textMuted}; white-space:nowrap; vertical-align:top;${options?.last ? "" : ` border-bottom:1px solid ${BRAND.colors.borderSubtle};`}">${label}</td>
    <td style="padding:14px 16px; font-family:${BRAND.fonts.secondary}; font-size:13px; color:${options?.highlight ? BRAND.colors.gold : BRAND.colors.textPrimary}; text-align:right;${options?.highlight ? " font-weight:700; font-size:16px;" : ""}${options?.last ? "" : ` border-bottom:1px solid ${BRAND.colors.borderSubtle};`}">${value}</td>
  </tr>`;
}

/** Reusable component: CTA Button */
function ctaButton(text: string, url: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0;">
    <tr>
      <td style="border-radius:8px; background:linear-gradient(135deg, ${BRAND.colors.gold} 0%, ${BRAND.colors.goldDark} 100%);">
        <a href="${url}" target="_blank" style="display:inline-block; padding:14px 32px; font-family:${BRAND.fonts.secondary}; font-size:14px; font-weight:700; color:${BRAND.colors.textInverse}; text-decoration:none; letter-spacing:0.3px;">${text}</a>
      </td>
    </tr>
  </table>`;
}

/** Reusable component: Info callout box */
function calloutBox(text: string, variant: "warning" | "info" | "danger" = "info"): string {
  const colors = {
    warning: { bg: BRAND.colors.warningBg, border: BRAND.colors.warningBorder, text: BRAND.colors.warning, icon: "&#9888;&#65039;" },
    info: { bg: BRAND.colors.infoBg, border: BRAND.colors.infoBorder, text: BRAND.colors.info, icon: "&#8505;&#65039;" },
    danger: { bg: BRAND.colors.dangerBg, border: BRAND.colors.dangerBorder, text: BRAND.colors.danger, icon: "&#128680;" },
  };
  const c = colors[variant];
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;">
    <tr>
      <td style="padding:16px 20px; background:${c.bg}; border:1px solid ${c.border}; border-radius:10px; border-left:3px solid ${c.text};">
        <p style="margin:0; font-family:${BRAND.fonts.secondary}; font-size:13px; line-height:20px; color:${BRAND.colors.textSecondary};">
          <span style="font-size:14px; margin-right:6px;">${c.icon}</span> ${text}
        </p>
      </td>
    </tr>
  </table>`;
}

/** Reusable component: Signature block */
function signatureBlock(): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:32px;">
    <tr>
      <td style="padding-top:24px; border-top:1px solid ${BRAND.colors.borderDefault};">
        <p style="margin:0 0 4px 0; font-family:${BRAND.fonts.secondary}; font-size:13px; color:${BRAND.colors.textSecondary};">With regards,</p>
        <p style="margin:0 0 2px 0; font-family:${BRAND.fonts.primary}; font-size:15px; font-weight:700; color:${BRAND.colors.gold};">Horizon Global Capital</p>
        <p style="margin:0; font-family:${BRAND.fonts.secondary}; font-size:12px; color:${BRAND.colors.textMuted}; font-style:italic;">${BRAND.tagline}</p>
      </td>
    </tr>
  </table>`;
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

function statusLabel(status: string): { text: string; variant: "success" | "warning" | "danger" | "info" } {
  const s = (status || "").toLowerCase();
  if (s === "approved" || s === "completed") return { text: "Completed", variant: "success" };
  if (s === "pending_verification") return { text: "Pending Verification", variant: "warning" };
  if (s === "rejected") return { text: "Rejected", variant: "danger" };
  return { text: "Pending", variant: "warning" };
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
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(n || 0));
  } catch {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(n || 0));
  }
}

function fmtDate(d: Date | string): string {
  const date = new Date(d);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
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
  "EHOSTUNREACH",
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
      const transient =
        TRANSIENT_CODES.has(code) || /timed?out/i.test(message) || /connection.*closed/i.test(message);

      console.warn(`[mail] Send attempt ${attempt} failed:`, {
        code,
        message: message.substring(0, 200),
        transient,
      });

      if (
        /EAUTH|ENVELOPE|EENVELOPE|EADDR/i.test(code) ||
        /auth/i.test(message) ||
        /invalid.*recipient/i.test(message) ||
        /user.*not.*found/i.test(message)
      ) {
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
      messageId: "SKIPPED-NO-RECIPIENT-" + Date.now(),
    };
  }

  return sendWithRetry(
    {
      from: FROM_DISPLAY,
      replyTo: REPLY_TO,
      envelope: { from: ENVELOPE_FROM, to: recipientList },
      to: recipientList,
      subject,
      text: text || html.replace(/<[^>]*>/g, ""),
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

// Helper: Look up additional notification emails for a user
async function getNotificationEmails(primaryEmail: string): Promise<string[]> {
  try {
    const mongoose = (await import("mongoose")).default;
    if (mongoose.connection.readyState !== 1) return [];
    const userDoc = await mongoose.connection.db
      ?.collection("users")
      .findOne(
        { email: { $regex: new RegExp(`^${primaryEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
        { projection: { notificationEmails: 1 } }
      );
    return Array.isArray(userDoc?.notificationEmails) ? userDoc.notificationEmails : [];
  } catch (err) {
    console.warn("[mail] Failed to fetch notification emails:", err);
    return [];
  }
}

// 2) Transaction event email
export async function sendTransactionEmail(
  to: string | string[],
  args: { name?: string; transaction: TxLike }
) {
  const primaryRecipients = Array.isArray(to) ? to : [to].filter(Boolean);
  if (primaryRecipients.length === 0) {
    console.warn("[mail] No recipients provided");
    return {
      accepted: [],
      rejected: [],
      skipped: true as const,
      messageId: "SKIPPED-NO-RECIPIENT-" + Date.now(),
    };
  }

  // Auto-include notification emails for the primary recipient
  const extraEmails = await getNotificationEmails(primaryRecipients[0]);
  const recipientList = [...new Set([...primaryRecipients, ...extraEmails])];

  const tx = normalizeTx(args.transaction);
  const status = statusLabel(tx.status);
  const sign = isCredit(tx.type) ? "+" : isDebit(tx.type) ? "-" : "";
  const signedAmount = sign + fmtAmount(tx.amount, tx.currency);
  const subject = `Transaction ${status.text}: ${tx.description || tx.type} ${signedAmount}`;
  const greetingName = args.name || "Valued Client";

  const amountColor = isCredit(tx.type) ? BRAND.colors.success : isDebit(tx.type) ? BRAND.colors.danger : BRAND.colors.textPrimary;

  const content = `
    ${greeting(greetingName)}
    ${leadText(`A transaction on your account has been processed. Please review the details below.`)}

    <!-- Transaction Amount Highlight -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 28px 0;">
      <tr>
        <td style="padding:24px; background:${BRAND.colors.bgElevated}; border:1px solid ${BRAND.colors.borderDefault}; border-radius:12px; text-align:center;">
          <p style="margin:0 0 6px 0; font-family:${BRAND.fonts.secondary}; font-size:12px; color:${BRAND.colors.textMuted}; text-transform:uppercase; letter-spacing:1px;">Transaction Amount</p>
          <p style="margin:0 0 12px 0; font-family:${BRAND.fonts.mono}; font-size:32px; font-weight:700; color:${amountColor}; letter-spacing:-0.5px;">${signedAmount}</p>
          ${statusBadge(status.text, status.variant)}
        </td>
      </tr>
    </table>

    <!-- Transaction Details Table -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:${BRAND.colors.bgElevated}; border:1px solid ${BRAND.colors.borderDefault}; border-radius:12px; overflow:hidden;">
      ${tableRow("Reference", tx.reference || String(tx._id))}
      ${tableRow("Description", tx.description)}
      ${tableRow("Type", capitalize(tx.type.replace(/-/g, " ")))}
      ${tableRow("Date", fmtDate(tx.date))}
      ${tableRow("Account", capitalize(tx.accountType), { last: true })}
    </table>

    ${calloutBox(
      "If you did not authorize this transaction, please contact our support team immediately at <strong>support@horizonglobalcapital.com</strong> or through your online banking portal.",
      status.variant === "danger" ? "danger" : "warning"
    )}

    ${signatureBlock()}
  `;

  const html = emailShell(content, {
    preheader: `Transaction ${status.text}: ${signedAmount} — ${tx.description}`,
  });

  const text_plain = [
    `Dear ${greetingName},`,
    ``,
    `A transaction on your account has been processed.`,
    ``,
    `Reference: ${tx.reference || String(tx._id)}`,
    `Description: ${tx.description}`,
    `Type: ${tx.type}`,
    `Amount: ${signedAmount}`,
    `Status: ${status.text}`,
    `Date: ${fmtDate(tx.date)}`,
    `Account: ${tx.accountType}`,
    ``,
    `If you did not authorize this transaction, please contact support immediately.`,
    ``,
    `With regards,`,
    `Horizon Global Capital`,
    `${BRAND.tagline}`,
  ].join("\n");

  return sendWithRetry(
    {
      from: FROM_DISPLAY,
      replyTo: REPLY_TO,
      envelope: { from: ENVELOPE_FROM, to: recipientList },
      to: recipientList,
      subject,
      text: text_plain,
      html,
      headers: {
        "List-Unsubscribe": LIST_UNSUBSCRIBE,
        "X-Transaction-Reference": tx.reference || String(tx._id),
        "X-Transaction-Type": String(tx.type),
        "X-Transaction-Status": status.text,
        "X-Priority": "2",
      },
    },
    3
  );
}

// 3) Welcome email
export async function sendWelcomeEmail(to: string, opts?: any) {
  try {
    const name = (opts?.name as string) || "Valued Client";
    const subject = "Welcome to Horizon Global Capital";

    const content = `
      <!-- Welcome hero -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 28px 0;">
        <tr>
          <td style="padding:32px 28px; background:linear-gradient(135deg, ${BRAND.colors.bgElevated} 0%, ${BRAND.colors.bgSubtle} 100%); border:1px solid ${BRAND.colors.borderAccent}; border-radius:12px; text-align:center;">
            <div style="width:56px; height:56px; background:linear-gradient(135deg, ${BRAND.colors.gold} 0%, ${BRAND.colors.goldDark} 100%); border-radius:14px; text-align:center; line-height:56px; margin:0 auto 20px auto;">
              <span style="font-size:24px;">&#10003;</span>
            </div>
            <h1 style="margin:0 0 8px 0; font-family:${BRAND.fonts.primary}; font-size:26px; font-weight:700; color:${BRAND.colors.textPrimary};" class="responsive-heading">Welcome to Horizon Global Capital</h1>
            <p style="margin:0; font-family:${BRAND.fonts.secondary}; font-size:14px; color:${BRAND.colors.gold}; font-style:italic;">${BRAND.tagline}</p>
          </td>
        </tr>
      </table>

      ${greeting(name)}
      ${leadText("Thank you for choosing Horizon Global Capital. Your account has been successfully created and is now ready for use.")}

      <!-- Feature highlights -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="padding:16px 20px; background:${BRAND.colors.bgElevated}; border:1px solid ${BRAND.colors.borderDefault}; border-radius:10px; margin-bottom:8px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="padding-right:14px; vertical-align:top; font-size:18px;">&#127968;</td>
                <td>
                  <p style="margin:0 0 2px 0; font-family:${BRAND.fonts.secondary}; font-size:14px; font-weight:600; color:${BRAND.colors.textPrimary};">Secure Banking</p>
                  <p style="margin:0; font-family:${BRAND.fonts.secondary}; font-size:12px; color:${BRAND.colors.textMuted};">Industry-leading encryption and multi-factor authentication protect your assets.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr><td style="height:8px;"></td></tr>
        <tr>
          <td style="padding:16px 20px; background:${BRAND.colors.bgElevated}; border:1px solid ${BRAND.colors.borderDefault}; border-radius:10px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="padding-right:14px; vertical-align:top; font-size:18px;">&#127760;</td>
                <td>
                  <p style="margin:0 0 2px 0; font-family:${BRAND.fonts.secondary}; font-size:14px; font-weight:600; color:${BRAND.colors.textPrimary};">Global Transfers</p>
                  <p style="margin:0; font-family:${BRAND.fonts.secondary}; font-size:12px; color:${BRAND.colors.textMuted};">Seamless international transfers with competitive exchange rates and real-time tracking.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr><td style="height:8px;"></td></tr>
        <tr>
          <td style="padding:16px 20px; background:${BRAND.colors.bgElevated}; border:1px solid ${BRAND.colors.borderDefault}; border-radius:10px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="padding-right:14px; vertical-align:top; font-size:18px;">&#128200;</td>
                <td>
                  <p style="margin:0 0 2px 0; font-family:${BRAND.fonts.secondary}; font-size:14px; font-weight:600; color:${BRAND.colors.textPrimary};">Investment Portfolio</p>
                  <p style="margin:0; font-family:${BRAND.fonts.secondary}; font-size:12px; color:${BRAND.colors.textMuted};">Access diverse investment opportunities with professional portfolio management tools.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      ${ctaButton("Access Your Account", "https://horizonglobalcapital.com/dashboard")}

      ${calloutBox(
        "For your security, please complete your profile verification within 48 hours to unlock full account features.",
        "info"
      )}

      ${signatureBlock()}
    `;

    const html = emailShell(content, {
      preheader: `Welcome ${name}! Your Horizon Global Capital account is ready.`,
    });

    const text = [
      `Dear ${name},`,
      ``,
      `Welcome to Horizon Global Capital!`,
      ``,
      `Thank you for choosing us. Your account has been successfully created and is now ready for use.`,
      ``,
      `Features available to you:`,
      `- Secure Banking: Industry-leading encryption and multi-factor authentication`,
      `- Global Transfers: Seamless international transfers with competitive rates`,
      `- Investment Portfolio: Access diverse investment opportunities`,
      ``,
      `Access your account at: https://horizonglobalcapital.com/dashboard`,
      ``,
      `For your security, please complete your profile verification within 48 hours.`,
      ``,
      `With regards,`,
      `Horizon Global Capital`,
      `${BRAND.tagline}`,
    ].join("\n");

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
  let displayName = name || "Valued Client";

  if (optsOrBuffer && (optsOrBuffer instanceof Buffer || typeof (optsOrBuffer as any)?.byteLength === "number")) {
    attachment = { filename: filename || "statement.pdf", content: optsOrBuffer };
    if (periodStart && periodEnd) {
      periodText = `${new Date(periodStart).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} — ${new Date(periodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;
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

  const subject = periodText
    ? `Account Statement: ${periodText}`
    : "Your Account Statement";

  const content = `
    ${greeting(displayName)}
    ${leadText(periodText
      ? `Your account statement for <strong style="color:${BRAND.colors.textPrimary};">${periodText}</strong> is attached to this email.`
      : `Your account statement is attached to this email.`
    )}

    <!-- Statement card -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px 0;">
      <tr>
        <td style="padding:24px; background:${BRAND.colors.bgElevated}; border:1px solid ${BRAND.colors.borderDefault}; border-radius:12px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="padding-right:16px; vertical-align:top;">
                <div style="width:44px; height:44px; background:${BRAND.colors.goldMuted}; border:1px solid ${BRAND.colors.goldBorder}; border-radius:10px; text-align:center; line-height:44px;">
                  <span style="font-size:20px;">&#128196;</span>
                </div>
              </td>
              <td style="vertical-align:top;">
                <p style="margin:0 0 4px 0; font-family:${BRAND.fonts.secondary}; font-size:15px; font-weight:600; color:${BRAND.colors.textPrimary};">
                  ${attachment ? attachment.filename : "statement.pdf"}
                </p>
                <p style="margin:0; font-family:${BRAND.fonts.secondary}; font-size:12px; color:${BRAND.colors.textMuted};">
                  PDF Document &middot; Attached${periodText ? ` &middot; ${periodText}` : ""}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${calloutBox(
      "This statement is confidential and intended solely for the named recipient. Please store it securely and do not forward to unauthorized parties.",
      "info"
    )}

    ${signatureBlock()}
  `;

  const html = emailShell(content, {
    preheader: periodText
      ? `Your Horizon Global Capital statement for ${periodText} is ready`
      : "Your Horizon Global Capital account statement is ready",
  });

  const text_plain = [
    `Dear ${displayName},`,
    ``,
    periodText
      ? `Your account statement for ${periodText} is attached.`
      : `Your account statement is attached.`,
    ``,
    `This statement is confidential. Please store it securely.`,
    ``,
    `With regards,`,
    `Horizon Global Capital`,
    `${BRAND.tagline}`,
  ].join("\n");

  return sendWithRetry(
    {
      from: FROM_DISPLAY,
      replyTo: REPLY_TO,
      envelope: { from: ENVELOPE_FROM, to: [to] },
      to,
      subject,
      text: text_plain,
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
      messageId: "SKIPPED-NO-RECIPIENT-" + Date.now(),
    };
  }

  // Wrap plain content in branded shell if no custom HTML provided
  const finalHtml = html || emailShell(`
    ${leadText(text.replace(/\n/g, "<br>"))}
    ${signatureBlock()}
  `);

  return sendWithRetry(
    {
      from: FROM_DISPLAY,
      replyTo: REPLY_TO,
      envelope: { from: ENVELOPE_FROM, to: recipientList },
      to: recipientList,
      subject,
      text,
      html: finalHtml,
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

// 8) Export branded email shell for external use
export { emailShell, greeting, leadText, sectionHeading, statusBadge, calloutBox, ctaButton, signatureBlock, tableRow };

const mailService = {
  sendEmail,
  sendTransactionEmail,
  sendWelcomeEmail,
  sendBankStatementEmail,
  sendSimpleEmail,
  testSMTPConnection,
  transporter,
  // Template utilities
  emailShell,
  greeting,
  leadText,
  sectionHeading,
  statusBadge,
  calloutBox,
  ctaButton,
  signatureBlock,
  tableRow,
};

export default mailService;