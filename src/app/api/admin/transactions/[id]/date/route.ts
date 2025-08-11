import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";

const ENABLED = process.env.ENABLE_PENDING_TX === "1";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!ENABLED) {
      return NextResponse.json({ error: "Pending transaction feature is disabled" }, { status: 503 });
    }

    const body = await req.json().catch(() => ({}));
    const { date } = body || {};
    if (!date || isNaN(Date.parse(date))) {
      return NextResponse.json({ error: "Valid `date` (ISO string) is required" }, { status: 400 });
    }

    await connectDB();

    const tx = await Transaction.findById(params.id);
    if (!tx) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (!tx.originalDate) tx.originalDate = tx.date || tx.createdAt;
    tx.date = new Date(date);
    tx.editedDateByAdmin = true;
    await tx.save();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Edit date error:", err);
    return NextResponse.json({ error: err?.message || "Failed to update date" }, { status: 500 });
  }
}
