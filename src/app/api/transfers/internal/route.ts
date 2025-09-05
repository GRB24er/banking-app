// src/app/api/transfers/internal/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";

type AccountKey = "checking" | "savings" | "investment";
interface InternalTransferRequest {
  fromAccount: AccountKey;
  toAccount: AccountKey;
  amount: number | string;
  description?: string;
}

const parseAmount = (val: number | string) => {
  if (typeof val === "number") return val;
  const cleaned = `${val}`.replace(/[\s,]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
};

const ref = (prefix = "ITR") =>
  `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 7)
    .toUpperCase()}`;

/** Resolve a schema enum value for Transaction.type that matches our logical “debit/credit”. */
function resolveTxType(kind: "debit" | "credit") {
  // @ts-ignore
  const allowed: string[] = (Transaction?.schema?.path?.("type")?.enumValues as string[]) || [];
  const candidates: Record<"debit" | "credit", string[]> = {
    debit: ["debit", "withdrawal", "outflow", "expense", "sent", "decrease"],
    credit: ["credit", "deposit", "inflow", "income", "received", "increase"],
  };
  if (allowed.length) {
    if (allowed.includes(kind)) return kind;
    const match = candidates[kind].find((c) => allowed.includes(c));
    if (match) return match;
    return allowed[0];
  }
  return kind;
}

/** Resolve a “completed”-like status that fits your schema, with a safe fallback. */
function resolveCompletedStatus() {
  // @ts-ignore
  const allowed: string[] = (Transaction?.schema?.path?.("status")?.enumValues as string[]) || [];
  if (!allowed.length) return "completed";
  if (allowed.includes("completed")) return "completed";
  if (allowed.includes("approved")) return "approved";
  if (allowed.includes("success")) return "success";
  if (allowed.includes("posted")) return "posted";
  return allowed[0];
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as InternalTransferRequest;
    const missing: string[] = [];
    if (!body.fromAccount) missing.push("fromAccount");
    if (!body.toAccount) missing.push("toAccount");
    if (body.amount === undefined || body.amount === null) missing.push("amount");
    if (missing.length) {
      return NextResponse.json(
        { success: false, error: `Missing required field(s): ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    const from = body.fromAccount;
    const to = body.toAccount;
    if (from === to) {
      return NextResponse.json(
        { success: false, error: "fromAccount and toAccount must be different." },
        { status: 400 }
      );
    }

    const amount = parseAmount(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ success: false, error: "Invalid amount." }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    const fromKey = `${from}Balance` as const;
    const toKey = `${to}Balance` as const;
    const currentFromBalance = Number((user as any)[fromKey] ?? 0);
    const currentToBalance = Number((user as any)[toKey] ?? 0);

    if (amount > currentFromBalance) {
      return NextResponse.json({ success: false, error: "Insufficient funds." }, { status: 400 });
    }

    const debitType = resolveTxType("debit");
    const creditType = resolveTxType("credit");
    const completedStatus = resolveCompletedStatus();

    // Update balances (same user document)
    (user as any)[fromKey] = currentFromBalance - amount;
    (user as any)[toKey] = currentToBalance + amount;

    const pairId = ref("PAIR");
    const now = new Date();
    const baseMeta = {
      kind: "internal",
      pairId,
      fromAccount: from,
      toAccount: to,
      ui: { type: "internal", debitCreditHint: { from: "debit", to: "credit" } },
    };

    const debitTx = new (Transaction as any)({
      userId: user._id,
      accountType: from,
      type: debitType,
      amount: -amount,
      currency: (user as any).currency || "USD",
      description: body.description ? `Internal transfer to ${to} — ${body.description}` : `Internal transfer to ${to}`,
      reference: ref("ITR-D"),
      status: completedStatus,
      posted: true,
      postedAt: now,
      metadata: baseMeta,
    });

    const creditTx = new (Transaction as any)({
      userId: user._id,
      accountType: to,
      type: creditType,
      amount: amount,
      currency: (user as any).currency || "USD",
      description: body.description ? `Internal transfer from ${from} — ${body.description}` : `Internal transfer from ${from}`,
      reference: ref("ITR-C"),
      status: completedStatus,
      posted: true,
      postedAt: now,
      metadata: baseMeta,
    });

    await debitTx.save();
    await creditTx.save();
    await user.save();

    if (process.env.NODE_ENV !== "production") {
      // @ts-ignore
      const allowedTypeEnum = Transaction?.schema?.path?.("type")?.enumValues;
      // @ts-ignore
      const allowedStatusEnum = Transaction?.schema?.path?.("status")?.enumValues;
      console.warn("[InternalTransfer] type enum:", allowedTypeEnum, "status enum:", allowedStatusEnum);
    }

    return NextResponse.json({
      success: true,
      transfer: {
        pairId,
        from,
        to,
        amount,
        description: body.description || "Internal Transfer",
        status: completedStatus,
        postedAt: now,
      },
      balances: {
        checking: Number((user as any).checkingBalance ?? 0),
        savings: Number((user as any).savingsBalance ?? 0),
        investment: Number((user as any).investmentBalance ?? 0),
      },
    });
  } catch (err: any) {
    console.error("💥 Internal transfer error:", err);
    return NextResponse.json(
      { success: false, error: "Internal transfer failed.", details: process.env.NODE_ENV === "development" ? err?.message : undefined },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    const txs = await (Transaction as any).find({
      userId: user._id,
      "metadata.kind": "internal",
    }).sort({ createdAt: -1 }).limit(20).lean();

    const items = txs.map((tx: any) => ({
      reference: tx.reference,
      date: tx.postedAt || tx.date || tx.createdAt,
      type: tx.amount < 0 ? "debit" : "credit",
      amount: tx.amount,
      fromAccount: tx.metadata?.fromAccount,
      toAccount: tx.metadata?.toAccount,
      description: tx.description,
      status: tx.status,
    }));

    return NextResponse.json({ success: true, items });
  } catch (err: any) {
    console.error("💥 Get internal transfers error:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch transfer history" }, { status: 500 });
  }
}
