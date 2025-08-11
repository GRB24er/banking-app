// src/app/api/admin/user/[id]/deposit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/lib/mongodb";
import { sendTransactionEmail } from "@/lib/mail";
import { parseAmount } from "@/lib/amount";

// Optional: lock down allowed currencies
const DEFAULT_CURRENCY = "USD";

// You can allow admin to force-complete by sending { status: "completed" } in body.
// Otherwise default to pending to fit the approval flow.
const ALLOWED_STATUSES = new Set<"pending" | "completed" | "approved" | "rejected">([
  "pending",
  "completed",
  "approved",
  "rejected",
]);

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // 1) Auth + authorization
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Adjust this check to match your user object shape (isAdmin/role/etc.)
    const isAdmin =
      (session.user as any)?.isAdmin === true ||
      (session.user as any)?.role === "admin" ||
      (session.user as any)?.role === "superadmin";

    if (!isAdmin) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    // 2) Validate params
    const userId = context.params?.id;
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Missing user id" }, { status: 400 });
    }

    // 3) Read body
    const raw = await request.json().catch(() => ({} as any));

    // amount can include commas or currency symbols; we'll parse robustly
    let amount: number;
    try {
      amount = parseAmount(raw?.amount);
    } catch (err: any) {
      return NextResponse.json(
        { ok: false, error: err?.message ?? "Invalid amount." },
        { status: 400 }
      );
    }

    const description =
      typeof raw?.description === "string" && raw.description.trim()
        ? raw.description.trim()
        : "Admin deposit";

    const currency =
      typeof raw?.currency === "string" && raw.currency.trim()
        ? String(raw.currency).trim().toUpperCase()
        : DEFAULT_CURRENCY;

    // Admin may choose to set status; otherwise default pending
    let status: "pending" | "completed" | "approved" | "rejected" = "pending";
    if (raw?.status && ALLOWED_STATUSES.has(raw.status)) {
      status = raw.status;
    }

    // 4) Create transaction (keeps your existing DB helper)
    const { user, transaction } = await db.createTransaction(
      userId,
      {
        type: "deposit",
        amount,
        description,
        currency,
      },
      status
    );

    // 5) Email (don’t fail the whole request if email throws)
    try {
      await sendTransactionEmail(user.email, {
        name: user.name,
        transaction,
      });
    } catch (emailErr) {
      console.error("sendTransactionEmail failed:", emailErr);
      // continue
    }

    // 6) Done
    const message =
      status === "pending"
        ? "Deposit created and set to pending."
        : "Deposit created.";

    return NextResponse.json({ ok: true, message, transaction }, { status: 201 });
  } catch (err) {
    console.error("Admin deposit error:", err);
    return NextResponse.json({ ok: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// Optional: reply 405 for other verbs (helps avoid framework default pages)
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
