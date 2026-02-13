// src/app/api/fees/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { calculateFee, getAllFeeConfigs, initializeDefaultFees } from '@/lib/transactionFees';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    // Initialize fees if needed
    await initializeDefaultFees();

    const fees = await getAllFeeConfigs();
    
    if (type) {
      const fee = fees.find((f: any) => f.transactionType === type);
      return NextResponse.json({ success: true, fee });
    }

    return NextResponse.json({ success: true, fees });
  } catch (error: any) {
    console.error('[Fees] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch fees' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { transactionType, amount, currency } = await request.json();

    if (!transactionType || amount === undefined) {
      return NextResponse.json({ error: 'Transaction type and amount required' }, { status: 400 });
    }

    const feeResult = await calculateFee(transactionType, amount, currency || 'USD');

    return NextResponse.json({
      success: true,
      ...feeResult,
    });
  } catch (error: any) {
    console.error('[Fees] Error:', error);
    return NextResponse.json({ error: 'Failed to calculate fee' }, { status: 500 });
  }
}
