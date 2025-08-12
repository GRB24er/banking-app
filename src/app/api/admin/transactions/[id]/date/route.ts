// src/app/api/admin/transactions/[id]/date/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";

// Update a transaction's effective date (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // 👈 params is async in Next.js 15
) {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin =
      session?.user &&
      (((session.user as any).role === "admin") ||
        ((session.user as any).role === "superadmin") ||
        (session.user as any).isAdmin === true);

    if (!isAdmin) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params; // 👈 await it
    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const iso = body?.date as string | undefined;

    if (!iso || isNaN(new Date(iso).getTime())) {
      return NextResponse.json({ ok: false, error: "Invalid date" }, { status: 400 });
    }

    await connectDB();

    const tx = await Transaction.findById(id);
    if (!tx) {
      return NextResponse.json({ ok: false, error: "Transaction not found" }, { status: 404 });
    }

    tx.date = new Date(iso);
    (tx as any).editedDateByAdmin = true;
    await tx.save();

    return NextResponse.json({ ok: true, transaction: tx }, { status: 200 });
  } catch (err) {
    console.error("Transaction date update error:", err);
    return NextResponse.json({ ok: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// Optional: 405 for other verbs
export function GET() {
  return NextResponse.json({ ok: false, error: "Method Not Allowed" }, { status: 405 });
}
export function POST() {
  return NextResponse.json({ ok: false, error: "Method Not Allowed" }, { status: 405 });
}
export function PUT() {
  return NextResponse.json({ ok: false, error: "Method Not Allowed" }, { status: 405 });
}
export function DELETE() {
  return NextResponse.json({ ok: false, error: "Method Not Allowed" }, { status: 405 });
}
