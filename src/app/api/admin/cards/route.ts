// src/app/api/admin/cards/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { 
  getAllCardRequests,
  processCardRequest,
  activateCard,
  rejectCardRequest
} from '@/lib/virtualCardService';
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
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const cards = await getAllCardRequests({ status: status || undefined });

    return NextResponse.json({ success: true, cards });

  } catch (error: any) {
    console.error('[Admin Cards] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch cards' }, { status: 500 });
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
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { action, cardId, ...data } = await request.json();

    if (!cardId) {
      return NextResponse.json({ error: 'Card ID required' }, { status: 400 });
    }

    switch (action) {
      case 'process':
        const processResult = await processCardRequest(cardId, user._id.toString());
        if (!processResult.success) {
          return NextResponse.json({ error: processResult.error }, { status: 400 });
        }
        return NextResponse.json({
          success: true,
          message: 'Card is now processing',
          card: processResult.card,
        });

      case 'activate':
        if (!data.cardNumber || !data.expiryMonth || !data.expiryYear || !data.cvv) {
          return NextResponse.json({ error: 'Card details required' }, { status: 400 });
        }
        const activateResult = await activateCard(cardId, user._id.toString(), {
          cardNumber: data.cardNumber,
          expiryMonth: data.expiryMonth,
          expiryYear: data.expiryYear,
          cvv: data.cvv,
        });
        if (!activateResult.success) {
          return NextResponse.json({ error: activateResult.error }, { status: 400 });
        }
        return NextResponse.json({
          success: true,
          message: 'Card activated and user notified',
          card: activateResult.card,
        });

      case 'reject':
        if (!data.rejectionReason) {
          return NextResponse.json({ error: 'Rejection reason required' }, { status: 400 });
        }
        const rejectResult = await rejectCardRequest(cardId, user._id.toString(), data.rejectionReason);
        if (!rejectResult.success) {
          return NextResponse.json({ error: rejectResult.error }, { status: 400 });
        }
        return NextResponse.json({
          success: true,
          message: 'Card request rejected',
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[Admin Cards] Error:', error);
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}
