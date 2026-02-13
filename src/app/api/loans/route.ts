// src/app/api/loans/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { 
  createLoanApplication, 
  getUserLoanApplications, 
  LOAN_TYPES,
  calculateLoanDetails,
  determineInterestRate
} from '@/lib/loanService';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Public endpoints - no auth required
    if (action === 'types') {
      return NextResponse.json({ success: true, loanTypes: LOAN_TYPES });
    }

    if (action === 'calculate') {
      const loanType = searchParams.get('loanType') as keyof typeof LOAN_TYPES;
      const amount = parseFloat(searchParams.get('amount') || '0');
      const term = parseInt(searchParams.get('term') || '12');
      const creditScore = parseInt(searchParams.get('creditScore') || '700');
      const monthlyIncome = parseFloat(searchParams.get('monthlyIncome') || '5000');
      const employmentStatus = searchParams.get('employmentStatus') || 'employed';

      if (!LOAN_TYPES[loanType]) {
        return NextResponse.json({ error: 'Invalid loan type' }, { status: 400 });
      }

      const rate = determineInterestRate(loanType, creditScore, employmentStatus, amount, monthlyIncome);
      const details = calculateLoanDetails(amount, rate, term);

      return NextResponse.json({
        success: true,
        estimate: {
          loanType,
          amount,
          term,
          interestRate: rate,
          ...details,
        },
      });
    }

    // Protected endpoints - auth required
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const applications = await getUserLoanApplications(user._id.toString());

    return NextResponse.json({ success: true, applications });
  } catch (error: any) {
    console.error('[Loans] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch loans' }, { status: 500 });
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
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const data = await request.json();

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const result = await createLoanApplication(
      user._id.toString(),
      user.email,
      user.name,
      data,
      ip,
      userAgent
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Loan application submitted successfully',
      application: result.application,
    });
  } catch (error: any) {
    console.error('[Loans] Error:', error);
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
  }
}
