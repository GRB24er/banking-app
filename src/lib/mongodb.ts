// src/lib/mongodb.ts
import mongoose from "mongoose";
import User from "@/models/User";
import Transaction from "@/models/Transaction";

/** =========================================================
 * Mongo connection (cached)
 * ========================================================= */
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mattssonaxel54_db_user:IV38iOymzmEaYILX@atf.2rqxvcf.mongodb.net/?appName=atf';

let isConnecting = false;
let hasLoggedConnected = false;

export default async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose;
  if (isConnecting) return mongoose;

  isConnecting = true;
  try {
    await mongoose.connect(MONGODB_URI, {
      // @ts-ignore – let mongoose decide defaults
      dbName: process.env.MONGODB_DB || undefined,
    });
    if (!hasLoggedConnected) {
      console.log("✅ MongoDB connected");
      hasLoggedConnected = true;
    }
    return mongoose;
  } finally {
    isConnecting = false;
  }
}

/** =========================================================
 * Types & helpers (align with your schema)
 * ========================================================= */
export type AccountType = "checking" | "savings" | "investment";

export type TxType =
  | "deposit"
  | "withdraw"
  | "transfer-in"
  | "transfer-out"
  | "fee"
  | "interest"
  | "adjustment-credit"
  | "adjustment-debit";

export type TxStatus = "pending" | "completed" | "rejected" | "pending_verification";

const CREDIT_TYPES: ReadonlySet<TxType> = new Set([
  "deposit",
  "transfer-in",
  "interest",
  "adjustment-credit",
]);

const DEBIT_TYPES: ReadonlySet<TxType> = new Set([
  "withdraw",
  "transfer-out",
  "fee",
  "adjustment-debit",
]);

function normalizeTxType(t: any): TxType {
  const v = String(t || "").toLowerCase() as TxType;
  if (CREDIT_TYPES.has(v) || DEBIT_TYPES.has(v)) return v;
  return "deposit"; // safe fallback
}

function isCreditType(t: TxType): boolean {
  return CREDIT_TYPES.has(t);
}

function normalizeAccountType(v: any): AccountType {
  const s = String(v || "").toLowerCase();
  if (s === "savings") return "savings";
  if (s === "investment") return "investment";
  return "checking";
}

function balanceKey(acct: AccountType): "checkingBalance" | "savingsBalance" | "investmentBalance" {
  return acct === "savings" ? "savingsBalance" : acct === "investment" ? "investmentBalance" : "checkingBalance";
}

function makeReferenceFor(type: TxType) {
  const rnd = Math.random().toString(36).slice(2, 8).toUpperCase();
  const ts = Date.now().toString().slice(-6);
  if (type === "deposit") return `DEP-${ts}-${rnd}`;
  if (type === "withdraw") return `WTH-${ts}-${rnd}`;
  if (type === "transfer-in" || type === "transfer-out") return `TRF-${ts}-${rnd}`;
  if (type === "fee") return `FEE-${ts}-${rnd}`;
  if (type === "interest") return `INT-${ts}-${rnd}`;
  if (type === "adjustment-credit" || type === "adjustment-debit") return `ADJ-${ts}-${rnd}`;
  return `TX-${ts}-${rnd}`;
}

/** =========================================================
 * Public DB helpers
 * ========================================================= */
async function createTransaction(
  userId: string,
  data: any,
  initialStatus?: TxStatus
): Promise<{ user: any; transaction: any }> {
  await connectDB();

  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Normalize inputs
  const type: TxType = normalizeTxType(data?.type);
  const currency: string = (data?.currency ? String(data.currency) : "USD").toUpperCase();
  const amount: number = Number(
    typeof data?.amount === "string" ? data.amount.replace(/[^\d.-]/g, "") : data?.amount || 0
  );
  const description: string =
    typeof data?.description === "string" && data.description.trim()
      ? data.description.trim()
      : (type === "withdraw" || type === "transfer-out" || type === "fee" || type === "adjustment-debit")
      ? "Debit"
      : "Credit";

  const accountType: AccountType = normalizeAccountType(data?.accountType);
  const status: TxStatus =
    (initialStatus as TxStatus) && ["pending", "completed", "rejected", "pending_verification"].includes(initialStatus!)
      ? (initialStatus as TxStatus)
      : "pending";

  const ref: string = data?.reference || makeReferenceFor(type);
  const date: Date = data?.date ? new Date(data.date) : new Date();

  // Create the transaction (not posted by default)
  const transaction = await Transaction.create({
    userId: user._id,
    type,
    currency,
    amount,
    description,
    status,
    date,
    accountType,
    posted: false,
    postedAt: null,
    reference: ref,
    channel: data?.channel || "system",
    origin: data?.origin || "db_helper",
    // keep any extra custom fields if passed
    ...("editedDateByAdmin" in (data || {}) ? { editedDateByAdmin: Boolean(data.editedDateByAdmin) } : {}),
  });

  // If created in "completed" state, post immediately to balances.
  if (status === "completed") {
    const key = balanceKey(accountType);
    const current = Number((user as any)[key] || 0);
    const delta = isCreditType(type) ? amount : -amount;
    const newBalance = current + delta;

    (user as any)[key] = newBalance;
    await user.save();

    transaction.posted = true;
    transaction.postedAt = new Date();
    await transaction.save();
  }

  // Return lean-ish versions to keep response small
  return {
    user: user.toObject ? user.toObject() : user,
    transaction: transaction.toObject ? transaction.toObject() : transaction,
  };
}

export const db = {
  createTransaction,
};