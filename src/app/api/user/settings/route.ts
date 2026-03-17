// src/app/api/user/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email })
      .select('name email settings notificationEmails')
      .lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const nameParts = (user.name || '').split(' ');
    const settings = (user as any).settings || {};

    return NextResponse.json({
      profile: {
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: user.email || '',
        phone: settings.phone || '',
        address: settings.address || '',
        city: settings.city || '',
        country: settings.country || '',
        postalCode: settings.postalCode || '',
      },
      security: settings.security || {
        twoFactorEnabled: false,
        biometricEnabled: false,
        loginAlerts: true,
        sessionTimeout: 30,
      },
      notifications: settings.notifications || {
        transactionAlerts: true,
        accountUpdates: true,
        marketingEmails: false,
        securityAlerts: true,
        monthlyStatements: true,
      },
      privacy: settings.privacy || {
        dataSharing: false,
        activityTracking: true,
        profileVisibility: false,
      },
    });
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const updateData: Record<string, any> = {};

    if (body.profile) {
      const { firstName, lastName, phone, address, city, country, postalCode } = body.profile;
      if (firstName || lastName) {
        updateData.name = `${firstName || ''} ${lastName || ''}`.trim();
      }
      updateData['settings.phone'] = phone || '';
      updateData['settings.address'] = address || '';
      updateData['settings.city'] = city || '';
      updateData['settings.country'] = country || '';
      updateData['settings.postalCode'] = postalCode || '';
    }

    if (body.security) {
      updateData['settings.security'] = body.security;
    }

    if (body.notifications) {
      updateData['settings.notifications'] = body.notifications;
    }

    if (body.privacy) {
      updateData['settings.privacy'] = body.privacy;
    }

    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: updateData },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Settings saved' });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const updateData: Record<string, any> = {};

    if (body.security) {
      updateData['settings.security'] = body.security;
    }

    if (body.notifications) {
      updateData['settings.notifications'] = body.notifications;
    }

    if (body.privacy) {
      updateData['settings.privacy'] = body.privacy;
    }

    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: updateData },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Settings saved' });
  } catch (error) {
    console.error('Settings save error:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
