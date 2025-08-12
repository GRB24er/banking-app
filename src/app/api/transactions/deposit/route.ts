// src/app/api/transactions/deposit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import { parseAmount } from "@/lib/amount";
import { sendTransactionEmail } from "@/lib/mail";

export const runtime = "nodejs";

/**
 * User-initiated deposit request.
 * NOTE: Per your flow, all transactions start as "pending".
 * Admin will later complete/reject and (if needed) post to balances.
 */
export async function POST(request: NextRequest) {
  try {
    // 1) Auth
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // 2) Body
    const raw = await request.json().catch(() => ({} as any));

    let amount: number;
    try {
      amount = parseAmount(raw?.amount); // supports "45,909,900.98", "$1,234.56", etc.
    } catch (err: any) {
      return NextResponse.json({ ok: false, error: err?.message ?? "Invalid amount." }, { status: 400 });
    }
    if (amount <= 0) {
      return NextResponse.json({ ok: false, error: "Amount must be greater than zero." }, { status: 400 });
    }

    const description =
      typeof raw?.description === "string" && raw.description.trim()
        ? raw.description.trim()
        : "Deposit request";

    const currency =
      typeof raw?.currency === "string" && raw.currency.trim()
        ? String(raw.currency).trim().toUpperCase()
        : "USD";

    const accountTypeRaw = String(raw?.accountType || "").toLowerCase();
    const accountType: "checking" | "savings" | "investment" =
      accountTypeRaw === "savings" ? "savings" : accountTypeRaw === "investment" ? "investment" : "checking";

    // 3) DB + Create pending transaction only (no balance mutation here)
    await connectDB();

    const tx = await Transaction.create({
      userId: session.user.id,
      type: "deposit",           // schema-valid type
      currency,
      amount,
      description,
      status: "pending",         // always pending first
      date: new Date(),
      accountType,
      posted: false,             // not posted to balance yet
      postedAt: null,
      reference: `DEP-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      channel: "user_portal",
      origin: "user_deposit",
    });

    // 4) Best-effort email (do not fail request if email fails)
    try {
      await sendTransactionEmail(String(session.user.email || ""), {
        name: (session.user as any)?.name || undefined,
        transaction: tx,
      });
    } catch (emailErr) {
      console.warn("sendTransactionEmail failed (continuing):", emailErr);
    }

    return NextResponse.json(
      {
        ok: true,
        message: "Deposit created and set to pending.",
        transaction: tx,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Deposit error:", err);
    return NextResponse.json({ ok: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// Optional: reply 405 for other verbs to avoid default pages
export function GET() {
  return NextResponse.json({ ok: false, error: "Method Not Allowed" }, { status: 405 });
}
export function PUT() {
  return NextResponse.json({ ok: false, error: "Method Not Allowed" }, { status: 405 });
}
export function PATCH() {
  return NextResponse.json({ ok: false, error: "Method Not Allowed" }, { status: 405 });
}
export function DELETE() {
  return NextResponse.json({ ok: false, error: "Method Not Allowed" }, { status: 405 });
}
