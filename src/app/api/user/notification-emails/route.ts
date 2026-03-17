import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

const EMAIL_REGEX = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
const MAX_NOTIFICATION_EMAILS = 5;

// GET: Fetch notification emails for current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email })
      .select('notificationEmails')
      .lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      notificationEmails: (user as any).notificationEmails || [],
    });
  } catch (error) {
    console.error('Notification emails fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch notification emails' }, { status: 500 });
  }
}

// POST: Add a notification email
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    if (normalizedEmail === session.user.email.toLowerCase()) {
      return NextResponse.json({ error: 'Cannot add your own account email' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const existing = user.notificationEmails || [];

    if (existing.some((e: string) => e.toLowerCase() === normalizedEmail)) {
      return NextResponse.json({ error: 'Email already added' }, { status: 400 });
    }

    if (existing.length >= MAX_NOTIFICATION_EMAILS) {
      return NextResponse.json(
        { error: `Maximum of ${MAX_NOTIFICATION_EMAILS} notification emails allowed` },
        { status: 400 }
      );
    }

    user.notificationEmails = [...existing, normalizedEmail];
    await user.save();

    return NextResponse.json({
      success: true,
      notificationEmails: user.notificationEmails,
    });
  } catch (error) {
    console.error('Add notification email error:', error);
    return NextResponse.json({ error: 'Failed to add notification email' }, { status: 500 });
  }
}

// DELETE: Remove a notification email
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    await connectDB();
    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { $pull: { notificationEmails: normalizedEmail } },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      notificationEmails: user.notificationEmails,
    });
  } catch (error) {
    console.error('Remove notification email error:', error);
    return NextResponse.json({ error: 'Failed to remove notification email' }, { status: 500 });
  }
}
