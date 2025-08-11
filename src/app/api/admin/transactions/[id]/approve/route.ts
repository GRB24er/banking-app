import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/TransactionV2";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const isAdmin =
      (session.user as any)?.isAdmin === true ||
      (session.user as any)?.role === "admin" ||
      (session.user as any)?.role === "superadmin";
    if (!isAdmin) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    if (!id) return NextResponse.json({ ok: false, error: "Missing transaction id" }, { status: 400 });

    const body = await req.json().catch(() => ({} as any));
    const maybeDate = body?.date ? new Date(body.date) : null;

    await connectDB();

    const one = await Transaction.findById(id);
    if (!one) return NextResponse.json({ ok: false, error: "Transaction not found" }, { status: 404 });
    if (!["pending", "pending_verification"].includes(one.status)) {
      return NextResponse.json({ ok: false, error: `Only pending can be approved (found '${one.status}').` }, { status: 400 });
    }

    const filter: any = one.reference ? { reference: one.reference } : { _id: one._id };
    const update: any = { status: "approved" };
    if (maybeDate && !isNaN(maybeDate.getTime())) {
      update.date = maybeDate;
      update.editedDateByAdmin = true;
    }

    const result = await Transaction.updateMany(
      { ...filter, status: { $in: ["pending", "pending_verification"] } },
      { $set: update }
    );

    const tx = await Transaction.findById(id);
    return NextResponse.json(
      { ok: true, message: `Approved ${result.modifiedCount} transaction(s).`, transaction: tx },
      { status: 200 }
    );
  } catch (err) {
    console.error("Approve error:", err);
    return NextResponse.json({ ok: false, error: "Internal Server Error" }, { status: 500 });
  }
}
