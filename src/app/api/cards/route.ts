// src/app/api/cards/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { 
  requestVirtualCard,
  getUserCards,
  generateRevealToken,
  revealCardDetails,
  freezeCard,
  unfreezeCard,
  cancelCard,
  CARD_TIERS
} from '@/lib/virtualCardService';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Public - get card tiers
    if (action === 'tiers') {
      return NextResponse.json({ success: true, tiers: CARD_TIERS });
    }

    // Protected endpoints
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's cards
    const cards = await getUserCards(user._id.toString());
    return NextResponse.json({ success: true, cards });

  } catch (error: any) {
    console.error('[Cards] Error:', error);
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
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { action, cardId, ...data } = await request.json();

    switch (action) {
      case 'request':
        const requestResult = await requestVirtualCard(
          user._id.toString(),
          user.email,
          user.name,
          data
        );
        if (!requestResult.success) {
          return NextResponse.json({ error: requestResult.error }, { status: 400 });
        }
        return NextResponse.json({
          success: true,
          message: 'Virtual card requested successfully',
          card: requestResult.card,
        });

      case 'generate_reveal_token':
        if (!cardId) {
          return NextResponse.json({ error: 'Card ID required' }, { status: 400 });
        }
        const tokenResult = await generateRevealToken(cardId, user._id.toString());
        if (!tokenResult.success) {
          return NextResponse.json({ error: tokenResult.error }, { status: 400 });
        }
        return NextResponse.json({
          success: true,
          token: tokenResult.token,
          expiresIn: 300, // 5 minutes
        });

      case 'reveal':
        if (!cardId || !data.token) {
          return NextResponse.json({ error: 'Card ID and token required' }, { status: 400 });
        }
        const revealResult = await revealCardDetails(cardId, user._id.toString(), data.token);
        if (!revealResult.success) {
          return NextResponse.json({ error: revealResult.error }, { status: 400 });
        }
        return NextResponse.json({
          success: true,
          cardDetails: revealResult.cardDetails,
        });

      case 'freeze':
        if (!cardId) {
          return NextResponse.json({ error: 'Card ID required' }, { status: 400 });
        }
        const freezeResult = await freezeCard(cardId, user._id.toString());
        if (!freezeResult.success) {
          return NextResponse.json({ error: freezeResult.error }, { status: 400 });
        }
        return NextResponse.json({ success: true, message: 'Card frozen' });

      case 'unfreeze':
        if (!cardId) {
          return NextResponse.json({ error: 'Card ID required' }, { status: 400 });
        }
        const unfreezeResult = await unfreezeCard(cardId, user._id.toString());
        if (!unfreezeResult.success) {
          return NextResponse.json({ error: unfreezeResult.error }, { status: 400 });
        }
        return NextResponse.json({ success: true, message: 'Card unfrozen' });

      case 'cancel':
        if (!cardId) {
          return NextResponse.json({ error: 'Card ID required' }, { status: 400 });
        }
        const cancelResult = await cancelCard(cardId, user._id.toString());
        if (!cancelResult.success) {
          return NextResponse.json({ error: cancelResult.error }, { status: 400 });
        }
        return NextResponse.json({ success: true, message: 'Card cancelled' });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[Cards] Error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
