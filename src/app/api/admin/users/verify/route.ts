import { NextResponse } from 'next/server';
import { db } from '@/lib/mongodb';

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID required' },
        { status: 400 }
      );
    }

    const user = await verifyUser(userId);
    return NextResponse.json(
      { success: true, user },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Verification failed' 
      },
      { status: 500 }
    );
  }
}