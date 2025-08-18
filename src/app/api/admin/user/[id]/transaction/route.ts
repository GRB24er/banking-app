// src/app/api/admin/user/[id]/transaction/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";

// In Next.js 15, route context params are async
type Context = { params: Promise<{ id: string }> };

type AccountType = "checking" | "savings" | "investment";
type InputType = "credit" | "debit" | "deposit" | "withdraw";

const isAccountType = (x: unknown): x is AccountType =>
  x === "checking" || x === "savings" || x === "investment";

const toNumber = (v: unknown): number => {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    // allow "45,458,575.89" and spaces
    const n = Number(v.replace(/[, ]+/g, ""));
    return n;
  }
  return NaN;
};

const toCanonical = (t: string): "credit" | "debit" => {
  const s = String(t).toLowerCase();
  if (s === "credit" || s === "deposit") return "credit";
  if (s === "debit" || s === "withdraw") return "debit";
  return "debit";
};

export async function POST(req: NextRequest, ctx: Context) {
  try {
    const { id } = await ctx.params; // ✅ await async params

    const session = await getServerSession(authOptions);
    // Keep your strict admin gate
    if (!session?.user?.email || session.user.email !== "admin@horizonbank.com") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const {
      type,
      amount,
      accountType,
      description,
      currency = "USD",
      reference,
    } = body as {
      type: InputType;
      amount: number | string;
      accountType: AccountType;
      description?: string;
      currency?: string;
      reference?: string;
    };

    if (!type || amount == null || !accountType) {
      return NextResponse.json(
        { error: "Missing required fields: type, amount, accountType" },
        { status: 400 }
      );
    }
    if (!isAccountType(accountType)) {
      return NextResponse.json({ error: "Invalid accountType" }, { status: 400 });
    }

    const amt = toNumber(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const canonical = toCanonical(type);

    await connectDB();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Apply balance immediately (instant completed posting)
    let newBalance: number;
    if (accountType === "checking") {
      if (canonical === "debit" && (user.checkingBalance ?? 0) < amt) {
        return NextResponse.json(
          { error: "Insufficient funds in checking account" },
          { status: 400 }
        );
      }
      user.checkingBalance = (user.checkingBalance ?? 0) + (canonical === "credit" ? amt : -amt);
      newBalance = user.checkingBalance;
    } else if (accountType === "savings") {
      if (canonical === "debit" && (user.savingsBalance ?? 0) < amt) {
        return NextResponse.json(
          { error: "Insufficient funds in savings account" },
          { status: 400 }
        );
      }
      user.savingsBalance = (user.savingsBalance ?? 0) + (canonical === "credit" ? amt : -amt);
      newBalance = user.savingsBalance;
    } else {
      if (canonical === "debit" && (user.investmentBalance ?? 0) < amt) {
        return NextResponse.json(
          { error: "Insufficient funds in investment account" },
          { status: 400 }
        );
      }
      user.investmentBalance = (user.investmentBalance ?? 0) + (canonical === "credit" ? amt : -amt);
      newBalance = user.investmentBalance;
    }

    await user.save();

    // Record transaction as completed + posted
    const now = new Date();
    const tx = await Transaction.create({
      userId: user._id,
      // keep your original mapping for storage
      type: canonical === "credit" ? "deposit" : "withdraw",
      currency,
      amount: amt,
      description:
        description ?? `Admin ${canonical === "credit" ? "Credit" : "Debit"} - ${now.toLocaleDateString()}`,
      status: "completed",
      date: now,
      accountType,
      posted: true,
      postedAt: now,
      reference: reference ?? `ADM-${canonical.toUpperCase()}-${now.getTime()}`,
      category: "Admin Transaction",
      channel: "admin",
      origin: "admin_panel",
    });

    return NextResponse.json({
      success: true,
      message: `Successfully ${canonical === "credit" ? "credited" : "debited"} ${amt} ${currency} to ${user.name}'s ${accountType} account`,
      transaction: {
        id: tx._id.toString(),
        reference: tx.reference,
        type: tx.type,
        status: tx.status,
        amount: amt,
        currency,
        accountType,
        newBalance,
      },
    });
  } catch (error) {
    console.error("Admin transaction error:", error);
    return NextResponse.json({ error: "Transaction failed" }, { status: 500 });
  }
}
