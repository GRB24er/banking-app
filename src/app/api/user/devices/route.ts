// src/app/api/user/devices/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { getUserDevices, getLoginHistory, blockDevice, unblockDevice, trustDevice } from '@/lib/deviceTracking';
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
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const devices = await getUserDevices(user._id.toString());
    const loginHistory = await getLoginHistory(user._id.toString(), 20);

    return NextResponse.json({
      success: true,
      devices,
      loginHistory,
    });
  } catch (error: any) {
    console.error('[Devices] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch devices' }, { status: 500 });
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

    const { action, deviceId } = await request.json();

    if (!deviceId) {
      return NextResponse.json({ error: 'Device ID required' }, { status: 400 });
    }

    let result = false;

    switch (action) {
      case 'block':
        result = await blockDevice(user._id.toString(), deviceId);
        break;
      case 'unblock':
        result = await unblockDevice(user._id.toString(), deviceId);
        break;
      case 'trust':
        result = await trustDevice(user._id.toString(), deviceId);
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({
      success: result,
      message: result ? `Device ${action}ed successfully` : 'Action failed',
    });
  } catch (error: any) {
    console.error('[Devices] Error:', error);
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}
