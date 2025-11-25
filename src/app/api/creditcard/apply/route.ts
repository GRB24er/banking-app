// src/app/api/creditcard/apply/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectDB from '@/lib/mongodb';
import CreditCardApplication from '@/models/CreditCardApplication';
import User from '@/models/User';

const authOptions = {
  secret: 'b3bc4dcf9055e490cef86fd9647fc8acd61d6bbe07dfb85fb6848bfe7f4f3926',
};

export async function POST(req: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Please login to apply for credit card' },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const data = await req.json();

    const applicationNumber = `CC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const application = await CreditCardApplication.create({
      userId: user._id,
      applicationNumber,
      personalInfo: data.personalInfo || {},
      employmentInfo: data.employmentInfo || {},
      financialInfo: data.financialInfo || {},
      cardPreferences: data.cardPreferences || {},
      status: 'submitted',
      workflow: {
        submittedAt: new Date(),
        lastUpdatedAt: new Date()
      },
      compliance: {
        consentToCreditCheck: data.consentToCreditCheck || false,
        consentDate: new Date(),
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Credit card application submitted successfully',
      data: {
        applicationNumber: application.applicationNumber,
        status: application.status,
        submittedAt: application.workflow?.submittedAt
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit application' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Get ALL applications with ALL fields
    const applications = await CreditCardApplication.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .lean();

    console.log('📊 Found applications:', applications.length);
    if (applications.length > 0) {
      console.log('🔍 First app data:', {
        status: applications[0].status,
        hasWorkflow: !!applications[0].workflow,
        hasApproval: !!applications[0].workflow?.approval,
        approvalData: applications[0].workflow?.approval
      });
    }

    return NextResponse.json({ success: true, data: applications });

  } catch (error: any) {
    console.error('❌ GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}