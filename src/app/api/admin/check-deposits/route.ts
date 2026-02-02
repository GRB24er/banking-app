// app/api/admin/check-deposits/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import CheckDeposit from '@/models/CheckDeposit';
import User from '@/models/User';

// GET /api/admin/check-deposits - Get all deposits (admin only)
export async function GET(request: NextRequest) {
  console.log('[Admin Check Deposits] GET');

  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const query: any = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const deposits = await CheckDeposit.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await CheckDeposit.countDocuments(query);

    // Get counts by status
    const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
      CheckDeposit.countDocuments({ status: 'pending' }),
      CheckDeposit.countDocuments({ status: 'approved' }),
      CheckDeposit.countDocuments({ status: 'rejected' }),
    ]);

    return NextResponse.json({
      success: true,
      deposits: deposits.map(d => ({
        id: d._id.toString(),
        userId: d.userId.toString(),
        userEmail: d.userEmail,
        userName: d.userName,
        accountType: d.accountType,
        amount: d.amount,
        checkNumber: d.checkNumber,
        frontImage: d.frontImage,
        backImage: d.backImage,
        status: d.status,
        rejectionReason: d.rejectionReason,
        notes: d.notes,
        createdAt: d.createdAt,
        reviewedAt: d.reviewedAt,
      })),
      counts: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        total: pendingCount + approvedCount + rejectedCount,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error: any) {
    console.error('[Admin Check Deposits] GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch deposits' },
      { status: 500 }
    );
  }
}