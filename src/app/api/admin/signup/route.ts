// src/app/api/admin/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

// Secret key for admin registration (store in .env in production)
const ADMIN_SECRET_KEY = 'ADMIN_SECRET_123';

export async function POST(request: NextRequest) {
  await dbConnect();
  
  try {
    const { name, email, password, secretKey } = await request.json();
    
    // Verify secret key
    if (secretKey !== ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { message: 'Invalid admin secret key' },
        { status: 401 }
      );
    }
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email, role: 'admin' });
    if (existingAdmin) {
      return NextResponse.json(
        { message: 'Admin account already exists' },
        { status: 400 }
      );
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create admin user with minimal required fields
    const adminUser = new User({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      balance: 0,
      // Add required fields with admin-specific values
      bitcoinAddress: 'admin-bitcoin-address',
      routingNumber: '000000000',
      accountNumber: 'ADMIN-ACCOUNT-001'
    });
    
    await adminUser.save();
    
    return NextResponse.json(
      { success: true, message: 'Admin account created successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Error creating admin account' },
      { status: 500 }
    );
  }
}