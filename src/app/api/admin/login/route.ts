import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';  // Corrected path
import User from '@/models/User';       // Corrected path
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  await dbConnect();
  
  try {
    const { email, password } = await request.json();
    
    // Find admin user by email
    const adminUser = await User.findOne({ 
      email: email.toLowerCase(),
      role: 'admin'
    }).select('+password');
    
    if (!adminUser) {
      return NextResponse.json(
        { message: 'Admin account not found' },
        { status: 401 }
      );
    }
    
    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, adminUser.password);
    
    if (!passwordMatch) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { success: true }, 
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}