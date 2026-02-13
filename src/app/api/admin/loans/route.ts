// src/app/api/admin/loans/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { 
  getAllLoanApplications,
  getLoanApplication,
  approveLoan,
  rejectLoan,
  disburseLoan,
  requestDocuments
} from '@/lib/loanService';
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

    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('id');
    const status = searchParams.get('status');
    const loanType = searchParams.get('loanType');

    if (applicationId) {
      const application = await getLoanApplication(applicationId);
      if (!application) {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, application });
    }

    const applications = await getAllLoanApplications({
      status: status || undefined,
      loanType: loanType || undefined,
    });

    return NextResponse.json({ success: true, applications });
  } catch (error: any) {
    console.error('[Admin Loans] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const { action, applicationId, ...data } = await request.json();

    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID required' }, { status: 400 });
    }

    let result;

    switch (action) {
      case 'approve':
        if (!data.approvedAmount || !data.approvedRate || !data.approvedTerm) {
          return NextResponse.json({ error: 'Approval details required' }, { status: 400 });
        }
        result = await approveLoan(applicationId, user._id.toString(), {
          approvedAmount: data.approvedAmount,
          approvedRate: data.approvedRate,
          approvedTerm: data.approvedTerm,
          conditions: data.conditions,
          reviewNotes: data.reviewNotes,
        });
        break;

      case 'reject':
        if (!data.rejectionReason) {
          return NextResponse.json({ error: 'Rejection reason required' }, { status: 400 });
        }
        result = await rejectLoan(applicationId, user._id.toString(), data.rejectionReason, data.reviewNotes);
        break;

      case 'disburse':
        if (!data.disbursementAccount || !data.disbursementReference) {
          return NextResponse.json({ error: 'Disbursement details required' }, { status: 400 });
        }
        result = await disburseLoan(applicationId, user._id.toString(), {
          disbursementAccount: data.disbursementAccount,
          disbursementReference: data.disbursementReference,
        });
        break;

      case 'request_documents':
        if (!data.requiredDocuments || !Array.isArray(data.requiredDocuments)) {
          return NextResponse.json({ error: 'Required documents list needed' }, { status: 400 });
        }
        result = await requestDocuments(applicationId, user._id.toString(), data.requiredDocuments, data.notes);
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Loan ${action} successful`,
      application: result.application,
    });
  } catch (error: any) {
    console.error('[Admin Loans] Error:', error);
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}
