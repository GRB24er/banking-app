// src/app/api/admin/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  await dbConnect();
  
  try {
    const { email, password } = await request.json();
    
    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find admin user
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
    console.error('Admin login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}