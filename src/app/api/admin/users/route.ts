import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';  // Corrected path
import User from '@/models/User';       // Corrected path

export async function GET(request: NextRequest) {
  await dbConnect();
  
  try {
    const users = await User.find({}, { password: 0 }).lean();
    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json(
      { message: 'Error fetching users' },
      { status: 500 }
    );
  }
}