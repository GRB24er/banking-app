// src/lib/mongodb.ts
import mongoose from "mongoose";
import User from "@/models/User";
import Transaction from "@/models/Transaction";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://sarahmorganme2844:WWznuJXRceASUfa4@justimagine.pvtpi05.mongodb.net/?retryWrites=true&w=majority&appName=Justimagine";

let isConnecting = false;
let hasLoggedConnected = false;

export default async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose;
  if (isConnecting) return mongoose;

  isConnecting = true;
  try {
    await mongoose.connect(MONGODB_URI, {
      // @ts-ignore
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

// Export types
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

export type TxStatus =
  | "pending"
  | "completed"
  | "approved"
  | "rejected"
  | "pending_verification";

// Helper to generate reference numbers
function makeReferenceFor(type: TxType): string {
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

function toDateOrUndefined(v?: Date | string) {
  if (!v) return undefined;
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d.getTime()) ? undefined : d;
}

type GetTransactionsOptions = {
  limit?: number;
  page?: number; // 1-based
  startDate?: Date | string;
  endDate?: Date | string;
  status?: TxStatus | TxStatus[];
  type?: TxType | TxType[];
  accountType?: AccountType;
  sort?: "asc" | "desc";
};

/**
 * Create a transaction - ALWAYS starts as PENDING
 * Admin must approve to update balances
 */
async function createTransaction(
  userId: string,
  data: {
    type: TxType;
    amount: number | string;
    currency?: string;
    description?: string;
    accountType?: AccountType;
    reference?: string;
    channel?: string;
    origin?: string;
    date?: Date | string;
    metadata?: any;
  }
): Promise<{ user: any; transaction: any }> {
  await connectDB();

  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Parse and validate amount - ALWAYS POSITIVE
  const amount = Math.abs(
    typeof data.amount === "string"
      ? parseFloat(data.amount.replace(/[^\d.-]/g, ""))
      : Number(data.amount || 0)
  );

  if (isNaN(amount) || amount <= 0) {
    throw new Error("Invalid amount");
  }

  // Create transaction - ALWAYS PENDING
  const transaction = await Transaction.create({
    userId: user._id,
    type: data.type,
    currency: (data.currency || "USD").toUpperCase(),
    amount,
    description: data.description || `${data.type} transaction`,
    status: "pending", // ALWAYS PENDING
    date: data.date ? new Date(data.date) : new Date(),
    accountType: data.accountType || "checking",
    posted: false,
    postedAt: null,
    reference: data.reference || makeReferenceFor(data.type),
    channel: data.channel || "system",
    origin: data.origin || "db_helper",
    metadata: data.metadata || {},
  });

  return {
    user: user.toObject ? user.toObject() : user,
    transaction: transaction.toObject ? transaction.toObject() : transaction,
  };
}

/**
 * Fetch transactions for a user (supports pagination + date range).
 * Used by:
 * - /api/transactions/recent
 * - /api/transactions/statement
 */
async function getTransactions(userId: string, opts: GetTransactionsOptions = {}) {
  await connectDB();

  const limit = Math.max(1, Math.min(Number(opts.limit ?? 20), 500));
  const page = Math.max(1, Number(opts.page ?? 1));
  const skip = (page - 1) * limit;

  const startDate = toDateOrUndefined(opts.startDate);
  const endDate = toDateOrUndefined(opts.endDate);

  const query: any = { userId };

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;
  }

  if (opts.accountType) query.accountType = opts.accountType;

  if (opts.status) {
    query.status = Array.isArray(opts.status) ? { $in: opts.status } : opts.status;
  }

  if (opts.type) {
    query.type = Array.isArray(opts.type) ? { $in: opts.type } : opts.type;
  }

  const sortDir = (opts.sort || "desc") === "asc" ? 1 : -1;

  // Sort by date first, then createdAt as a stable tiebreaker
  const docs = await Transaction.find(query)
    .sort({ date: sortDir, createdAt: sortDir })
    .skip(skip)
    .limit(limit)
    .lean();

  return docs;
}

export const db = {
  createTransaction,
  getTransactions,
};
