import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';  // Corrected path
import User from '@/models/User';       // Corrected path

export async function POST(request: NextRequest) {
  await dbConnect();
  
  try {
    const { userId, balance } = await request.json();
    
    // Validate input
    if (!userId || balance === undefined) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Update user balance
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { balance } },
      { new: true }
    ).select('-password');
    
    if (!updatedUser) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    return NextResponse.json(
      { message: 'Error updating balance' },
      { status: 500 }
    );
  }
}