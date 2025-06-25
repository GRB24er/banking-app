// File: src/app/api/admin/user/[id]/verify/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession }         from 'next-auth';
import { authOptions }              from '@/lib/authOptions';
import dbConnect                    from '@/lib/mongodb';
import User                         from '@/models/User';

export async function POST(
  request: NextRequest,
  context: any    // ← accept context as any to satisfy Next.js ParamCheck
) {
  // 1) Auth guard: only admins
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2) Connect to the database
  await dbConnect();

  // 3) Extract the dynamic [id] parameter
  const userId: string = context.params.id;

  // 4) Find the user
  const user = await User.findById(userId);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // 5) Verify the user
  user.verified = true;
  await user.save();

  // 6) Return success
  return NextResponse.json({ success: true });
}
