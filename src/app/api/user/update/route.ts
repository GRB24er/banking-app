// File: src/app/api/user/update/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/User';
import bcrypt from 'bcryptjs';

export async function PUT(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();
    if (!name || !email) {
      return NextResponse.json({ message: 'Name and email are required' }, { status: 400 });
    }

    await dbConnect();

    // Identify user (placeholder; replace with session)
    const userEmail = request.headers.get('x-user-email');
    if (!userEmail) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Check if new email is taken by someone else (if changed)
    if (email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) {
        return NextResponse.json({ message: 'Email is already in use' }, { status: 409 });
      }
    }

    user.name = name;
    user.email = email;

    if (password && password.length >= 6) {
      user.password = await bcrypt.hash(password, 10);
    } else if (password && password.length < 6) {
      return NextResponse.json({ message: 'Password must be ≥ 6 characters' }, { status: 400 });
    }

    await user.save();

    return NextResponse.json({ message: 'User updated successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error in /api/user/update:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
