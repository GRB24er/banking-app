import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = (searchParams.get("status") || "pending") as
      | "pending" | "approved" | "rejected";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "10", 10)));
    const query = (searchParams.get("query") || "").trim();

    // Base filter
    const filter: any = {};

    // Treat docs without a status as "approved" (legacy data safety)
    if (status === "approved") {
      filter.$or = [{ status: "approved" }, { status: { $exists: false } }];
    } else {
      filter.status = status;
    }

    // Optional user/txn search
    if (query) {
      const users = await User.find(
        {
          $or: [
            { name: { $regex: query, $options: "i" } },
            { email: { $regex: query, $options: "i" } },
          ],
        },
        { _id: 1 }
      ).lean();
      const userIds = users.map((u: any) => String(u._id));
      filter.$or = (filter.$or || []).concat([
        { _id: query },
        { userId: { $in: userIds } },
      ]);
    }

    const total = await Transaction.countDocuments(filter);
    const items = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate({ path: "userId", select: "name email", model: User })
      .lean();

    const normalized = items.map((t: any) => {
      const user = t.userId; // (your schema uses userId)
      return { ...t, user };
    });

    return NextResponse.json({ items: normalized, total, page, pageSize });
  } catch (err: any) {
    console.error("Admin list transactions error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to list transactions" },
      { status: 500 }
    );
  }
}
