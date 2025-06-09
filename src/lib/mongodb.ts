// src/lib/db.ts
import mongoose, { ConnectOptions } from 'mongoose';
import User from '@/models/User';

// Configuration with hardcoded fallback (as requested)
const MONGODB_URI = process.env.MONGODB_URI || 
  'mongodb+srv://jp87er:OyDiyQgYTV2yOcQV@justimagine.scciqgh.mongodb.net/bankdb?retryWrites=true&w=majority';

// Type for global mongoose cache
declare global {
  var mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

// Security warning for production
if (!process.env.MONGODB_URI && process.env.NODE_ENV === 'production') {
  console.error('\x1b[31m', '⚠️ SECURITY WARNING: Hard-coded MongoDB credentials in production!', '\x1b[0m');
}

if (!MONGODB_URI) {
  throw new Error('MongoDB URI is required');
}

// Initialize cache
let cached = global.mongoose || { conn: null, promise: null };

async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const opts: ConnectOptions = {
      bufferCommands: false,
      autoIndex: process.env.NODE_ENV !== 'production',
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then(mongoose => {
        console.log('✅ MongoDB connected');
        return mongoose;
      })
      .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        cached.promise = null;
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

// VERIFY USER FUNCTION
export async function verifyUser(userId: string) {
  try {
    await connectDB();
    const user = await User.findByIdAndUpdate(
      userId,
      { verified: true },
      { new: true }
    ).select('-password -__v');

    if (!user) throw new Error('User not found');
    return user;
  } catch (error) {
    console.error('Verify user error:', error);
    throw error;
  }
}

// DELETE USER FUNCTION
export async function deleteUser(userId: string) {
  try {
    await connectDB();
    const user = await User.findByIdAndDelete(userId)
      .select('-password -__v');

    if (!user) throw new Error('User not found');
    return user;
  } catch (error) {
    console.error('Delete user error:', error);
    throw error;
  }
}

// GET ALL USERS (for admin dashboard)
export async function getUsers() {
  try {
    await connectDB();
    return await User.find({})
      .select('-password -__v')
      .sort({ createdAt: -1 });
  } catch (error) {
    console.error('Get users error:', error);
    throw error;
  }
}

// Connection event handlers
mongoose.connection.on('connected', () => 
  console.log('Mongoose connected to DB'));

mongoose.connection.on('error', (err) => 
  console.error('Mongoose connection error:', err));

mongoose.connection.on('disconnected', () => 
  console.log('Mongoose disconnected'));

// Export everything
export { mongoose, connectDB };
export default connectDB;