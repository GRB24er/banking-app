// File: src/app/api/user/profile/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  // 1. Authenticate
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Load user
  await dbConnect();
  const user = await User.findOne({ email: session.user.email }).lean();
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // 3. Mask last 4 digits of accountNumber
  const acctNum = typeof user.accountNumber === "string" ? user.accountNumber : "";
  const masked  = acctNum.length >= 4 ? `••••${acctNum.slice(-4)}` : "••••0000";

  // 4. Build the payload
  return NextResponse.json({
    name:      user.name,
    email:     user.email,
    phone:     (user as any).phone || null,
    kycStatus: user.verified ? "Verified" : "Pending",
    accounts: [
      {
        type:          "Checking",
        accountNumber: masked,
        balance:       typeof user.balance === "number" ? user.balance : 0,
      },
    ],
  });
}
