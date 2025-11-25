// src/app/api/chat/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Chat from '@/models/Chat';
import User from '@/models/User';

const authOptions = {
  secret: 'b3bc4dcf9055e490cef86fd9647fc8acd61d6bbe07dfb85fb6848bfe7f4f3926',
};

export async function POST(req: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const { subject, initialMessage } = await req.json();

    if (!subject || !initialMessage) {
      return NextResponse.json(
        { success: false, error: 'Subject and initial message are required' },
        { status: 400 }
      );
    }

    // Check for existing active/pending chat
    const existingChat = await Chat.findOne({
      userId: user._id,
      status: { $in: ['pending', 'active'] }
    });

    if (existingChat) {
      return NextResponse.json({
        success: true,
        data: existingChat,
        message: 'Using existing active chat'
      });
    }

    // Create new chat with all required fields
    const chat = await Chat.create({
      userId: user._id,
      userName: user.name || session.user.name || 'User',
      userEmail: user.email,
      subject,
      status: 'pending',
      messages: [{
        senderId: user._id.toString(),
        senderName: user.name || session.user.name || 'User',
        senderRole: 'user',
        message: initialMessage,
        timestamp: new Date(),
        read: false
      }],
      lastMessageAt: new Date()
    });

    const populatedChat = await Chat.findById(chat._id).populate('userId', 'name email');

    return NextResponse.json({
      success: true,
      data: populatedChat
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ Create chat error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create chat' },
      { status: 500 }
    );
  }
}