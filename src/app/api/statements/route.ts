// src/app/api/statements/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { generateStatementData, generateStatementHTML, sendStatementEmail } from '@/lib/statementGenerator';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const accountType = searchParams.get('accountType') as 'checking' | 'savings' | 'investment' | 'all' | undefined;
    const format = searchParams.get('format') || 'json';

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Default to current month
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    const statementData = await generateStatementData(
      user._id.toString(),
      start,
      end,
      accountType || 'all'
    );

    if (!statementData) {
      return NextResponse.json({ error: 'Failed to generate statement' }, { status: 500 });
    }

    if (format === 'html') {
      const html = generateStatementHTML(statementData);
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `inline; filename="statement-${start.toISOString().split('T')[0]}-${end.toISOString().split('T')[0]}.html"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      statement: statementData,
    });
  } catch (error: any) {
    console.error('[Statements] Error:', error);
    return NextResponse.json({ error: 'Failed to generate statement' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { startDate, endDate, accountType, action } = await request.json();

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    if (action === 'email') {
      const result = await sendStatementEmail(user._id.toString(), start, end, accountType || 'all');
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('[Statements] Error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
