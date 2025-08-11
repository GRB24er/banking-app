// src/app/api/transactions/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Transaction from '@/models/Transaction';

const ENABLED = process.env.ENABLE_PENDING_TX === '1';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json().catch(() => ({}));
    const { userId, type, currency = 'USD', amount, date, description } = body || {};

    if (!userId || !type || !amount) {
      return NextResponse.json({ error: 'userId, type and amount are required' }, { status: 400 });
    }

    // If the feature is ON, we force status=pending and do NOT touch balances here.
    const tx = await Transaction.create({
      userId,
      type,
      currency,
      amount,
      date: date ? new Date(date) : new Date(),
      description,
      status: ENABLED ? 'pending' : 'approved',
      posted: false,    // balances will be applied only on admin approve
      postedAt: null,
    });

    return NextResponse.json({ success: true, transaction: tx });
  } catch (err: any) {
    console.error('Create transaction error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to create transaction' }, { status: 500 });
  }
}
