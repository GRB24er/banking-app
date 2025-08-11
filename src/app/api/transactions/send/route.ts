// src/app/api/transactions/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/TransactionV2"; // <-- use V2
import { parseAmount } from "@/lib/amount";
import { sendTransactionEmail } from "@/lib/mail";

export const runtime = "nodejs";

type AccountType = "checking" | "savings" | "investment";

function normalizeAcct(input: any): AccountType {
  const v = String(input || "").toLowerCase();
  if (v === "savings") return "savings";
  if (v === "investment") return "investment";
  return "checking";
}
function balanceKey(acct: AccountType) {
  return acct === "savings"
    ? "savingsBalance"
    : acct === "investment"
    ? "investmentBalance"
    : "checkingBalance";
}
function makeReference() {
  const rnd = Math.random().toString(36).slice(2, 8).toUpperCase();
  const ts = Date.now().toString().slice(-6);
  return `TRF-${ts}-${rnd}`;
}

export async function GET() {
  return NextResponse.json({ ok: true, route: "/api/transactions/send" }, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const raw = await request.json().catch(() => ({} as any));
    const fromAccount: AccountType = normalizeAcct(raw?.fromAccountType);
    const toAccount: AccountType | undefined =
      raw?.toAccountType ? normalizeAcct(raw?.toAccountType) : undefined;

    const toEmail: string | undefined =
      typeof raw?.toEmail === "string" && raw.toEmail.trim()
        ? raw.toEmail.trim().toLowerCase()
        : undefined;

    let amount: number;
    try {
      amount = parseAmount(raw?.amount);
    } catch (err: any) {
      return NextResponse.json({ ok: false, error: err?.message ?? "Invalid amount." }, { status: 400 });
    }

    const descriptionInput =
      typeof raw?.description === "string" && raw.description.trim()
        ? raw.description.trim()
        : "";

    if (!toEmail && !toAccount) {
      return NextResponse.json(
        { ok: false, error: "Provide either toEmail (P2P) or toAccountType (internal transfer)." },
        { status: 400 }
      );
    }
    if (toAccount && toAccount === fromAccount && !toEmail) {
      return NextResponse.json(
        { ok: false, error: "From and To accounts cannot be the same for internal transfer." },
        { status: 400 }
      );
    }

    await connectDB();

    const sender = await User.findById(session.user.id)
      .select("_id email name checkingBalance savingsBalance investmentBalance")
      .lean();
    if (!sender) {
      return NextResponse.json({ ok: false, error: "Sender not found." }, { status: 404 });
    }

    const senderKey = balanceKey(fromAccount);
    const senderAvail = (sender as any)[senderKey] || 0;
    if (senderAvail < amount) {
      return NextResponse.json(
        { ok: false, error: "Insufficient cleared funds in the selected account." },
        { status: 400 }
      );
    }

    const reference = makeReference();
    const now = new Date();

    // P2P (to another user)
    if (toEmail && toEmail !== String(sender.email).toLowerCase()) {
      const recipient = await User.findOne({ email: toEmail })
        .select("_id email name")
        .lean();
      if (!recipient?._id) {
        return NextResponse.json({ ok: false, error: "Recipient not found for the provided email." }, { status: 404 });
      }

      const toAcct: AccountType = toAccount ?? "checking";

      const outTx = await Transaction.create({
        userId: sender._id,
        type: "transfer-out",
        currency: "USD",
        amount,
        description: descriptionInput || `Transfer to ${toEmail}`,
        status: "pending",
        date: now,
        accountType: fromAccount,
        posted: false,
        postedAt: null,
        reference,
        channel: "p2p",
        origin: "user_transfer",
      });

      const inTx = await Transaction.create({
        userId: recipient._id,
        type: "transfer-in",
        currency: "USD",
        amount,
        description: descriptionInput || `Transfer from ${sender.email}`,
        status: "pending",
        date: now,
        accountType: toAcct,
        posted: false,
        postedAt: null,
        reference,
        channel: "p2p",
        origin: "user_transfer",
      });

      try {
        await Promise.allSettled([
          sendTransactionEmail(String(sender.email), {
            name: (sender as any).name || undefined,
            transaction: outTx,
          }),
          sendTransactionEmail(String(recipient.email), {
            name: (recipient as any).name || undefined,
            transaction: inTx,
          }),
        ]);
      } catch {}

      return NextResponse.json(
        {
          ok: true,
          message: "Transfer created and set to pending.",
          reference,
          senderTransactionId: String(outTx._id),
          recipientTransactionId: String(inTx._id),
          status: "pending",
        },
        { status: 201 }
      );
    }

    // Internal transfer (same user)
    const toAcct: AccountType = toAccount ?? "checking";

    const outTx = await Transaction.create({
      userId: sender._id,
      type: "transfer-out",
      currency: "USD",
      amount,
      description: descriptionInput || `Transfer to ${toAcct}`,
      status: "pending",
      date: now,
      accountType: fromAccount,
      posted: false,
      postedAt: null,
      reference,
      channel: "internal",
      origin: "user_transfer",
    });

    const inTx = await Transaction.create({
      userId: sender._id,
      type: "transfer-in",
      currency: "USD",
      amount,
      description: descriptionInput || `Transfer from ${fromAccount}`,
      status: "pending",
      date: now,
      accountType: toAcct,
      posted: false,
      postedAt: null,
      reference,
      channel: "internal",
      origin: "user_transfer",
    });

    try {
      await sendTransactionEmail(String(sender.email), {
        name: (sender as any).name || undefined,
        transaction: outTx,
      });
    } catch {}

    return NextResponse.json(
      {
        ok: true,
        message: "Internal transfer created and set to pending.",
        reference,
        debitTransactionId: String(outTx._id),
        creditTransactionId: String(inTx._id),
        status: "pending",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Transfer error:", err);
    return NextResponse.json({ ok: false, error: "Internal Server Error" }, { status: 500 });
  }
}
