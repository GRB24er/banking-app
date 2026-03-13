// app/api/mobile/deposits/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import clientPromise from '@/lib/mongodb';

export const runtime = 'nodejs';
export const maxDuration = 60;

const JWT_SECRET =
  process.env.JWT_SECRET ||
  '308d98ab1034136b95e1f7b43f6afde185e5892d09bbe9d1e2b68e1db9c1acae';

async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  try {
    const token = authHeader.split(' ')[1];
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
  } catch {
    return null;
  }
}

/**
 * IMPORTANT FIX:
 * Some mongodb helpers return MongoClient, others return Db.
 * If you call `.db()` on a Db, you get: ".db is not a function".
 */
async function getDb() {
  const mongo = await clientPromise;

  // If mongo has a .db() function, it's a MongoClient
  if (mongo && typeof (mongo as any).db === 'function') {
    const dbName = process.env.MONGODB_DB; // optional
    return dbName ? (mongo as any).db(dbName) : (mongo as any).db();
  }

  // Otherwise assume mongo already IS the Db instance
  return mongo as any;
}

// GET /api/mobile/deposits - Get user's deposit history
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();

    const user = await db.collection('users').findOne({ email: auth.email });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const deposits = await db
      .collection('deposits')
      .find({ userId: user._id.toString() })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({
      success: true,
      deposits: deposits.map((d: any) => ({
        _id: d._id.toString(),
        amount: d.amount,
        accountType: d.accountType,
        status: d.status,
        checkFrontImage: d.checkFrontImage ? true : false,
        checkBackImage: d.checkBackImage ? true : false,
        reference: d.reference,
        createdAt: d.createdAt,
        reviewedAt: d.reviewedAt,
        reviewNote: d.reviewNote,
      })),
    });
  } catch (error: any) {
    console.error('Deposits fetch error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch deposits' },
      { status: 500 }
    );
  }
}

// POST /api/mobile/deposits - Submit new check deposit
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();

    const user = await db.collection('users').findOne({ email: auth.email });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch (parseError: any) {
      console.error('Body parse error:', parseError?.message);
      return NextResponse.json(
        { success: false, error: 'Request too large or invalid. Please try with smaller images.' },
        { status: 413 }
      );
    }

    const { amount, accountType, checkFrontImage, checkBackImage } = body;

    // Validation
    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 });
    }

    if (!['checking', 'savings'].includes(accountType)) {
      return NextResponse.json({ success: false, error: 'Invalid account type' }, { status: 400 });
    }

    // Images: normalize and store only a small thumbnail (first 500 chars) for reference
    // Full images are too large for Vercel serverless + MongoDB document limits
    const hasFront = typeof checkFrontImage === 'string' && checkFrontImage.length > 10;
    const hasBack = typeof checkBackImage === 'string' && checkBackImage.length > 10;

    if (!hasFront && !hasBack) {
      // Accept deposit even without images for reliability
      console.log('[mobile/deposits] No images provided, accepting anyway');
    }

    const reference = `DEP${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Strip data URI prefix if present, store truncated thumbnail
    const stripPrefix = (s: string) => s.replace(/^data:image\/\w+;base64,/, '');
    const frontThumb = hasFront ? stripPrefix(checkFrontImage).substring(0, 500) : '';
    const backThumb = hasBack ? stripPrefix(checkBackImage).substring(0, 500) : '';

    const deposit = {
      userId: user._id.toString(),
      userEmail: user.email,
      userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || 'Unknown',
      amount: Number(amount),
      accountType,
      checkFrontImage: frontThumb,
      checkBackImage: backThumb,
      hasCheckFront: hasFront,
      hasCheckBack: hasBack,
      status: 'pending',
      reference,
      createdAt: new Date(),
      reviewedAt: null,
      reviewedBy: null,
      reviewNote: null,
    };

    const result = await db.collection('deposits').insertOne(deposit);

    await db.collection('transactions').insertOne({
      userId: user._id.toString(),
      type: 'deposit',
      subType: 'check_deposit',
      amount: Number(amount),
      description: `Mobile Check Deposit - ${reference}`,
      accountType,
      status: 'pending',
      reference,
      depositId: result.insertedId.toString(),
      posted: false,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Check deposit submitted for review',
      deposit: {
        _id: result.insertedId.toString(),
        reference,
        amount: Number(amount),
        accountType,
        status: 'pending',
        createdAt: new Date(),
      },
    });
  } catch (error: any) {
    console.error('Deposit submit error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to submit deposit' },
      { status: 500 }
    );
  }
}