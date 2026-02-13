// src/app/api/admin/fees/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { getAllFeeConfigs, updateFeeConfig, initializeDefaultFees } from '@/lib/transactionFees';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    await initializeDefaultFees();
    const fees = await getAllFeeConfigs();

    return NextResponse.json({ success: true, fees });
  } catch (error: any) {
    console.error('[Admin Fees] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch fees' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { transactionType, updates } = await request.json();

    if (!transactionType || !updates) {
      return NextResponse.json({ error: 'Transaction type and updates required' }, { status: 400 });
    }

    const updated = await updateFeeConfig(transactionType, updates);

    return NextResponse.json({
      success: true,
      message: 'Fee configuration updated',
      fee: updated,
    });
  } catch (error: any) {
    console.error('[Admin Fees] Error:', error);
    return NextResponse.json({ error: 'Failed to update fee' }, { status: 500 });
  }
}
