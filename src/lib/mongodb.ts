import mongoose, { ConnectOptions } from 'mongoose';
import User from '@/models/User';
import { ITransaction } from '@/types/transaction';

// Hardcoded MongoDB connection string
const MONGODB_URI = 'mongodb+srv://sarahmorganme2844:WWznuJXRceASUfa4@justimagine.pvtpi05.mongodb.net/?retryWrites=true&w=majority&appName=Justimagine';

// Properly typed global mongoose cache
declare global {
  var _mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

// Initialize with proper typing
let cached: {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
} = global._mongoose || {
  conn: null,
  promise: null,
};

async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: ConnectOptions = {
      bufferCommands: false,
      autoIndex: process.env.NODE_ENV !== 'production',
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
        console.log('✅ MongoDB connected');
        return mongooseInstance;
      })
      .catch((err) => {
        console.error('❌ MongoDB connection error:', err);
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    // Reset promise on error to allow retries
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Main DB Operations
export const db = {
  async getUserById(id: string) {
    await connectDB();
    return await User.findById(id).select('-password -__v');
  },

  async getUserByEmail(email: string) {
    await connectDB();
    return await User.findOne({ email }).select('-password -__v');
  },

  async verifyUser(userId: string) {
    await connectDB();
    const user = await User.findByIdAndUpdate(
      userId,
      { verified: true },
      { new: true }
    ).select('-password -__v');

    if (!user) throw new Error('User not found');
    return user;
  },

  async deleteUser(userId: string) {
    await connectDB();
    const user = await User.findByIdAndDelete(userId).select('-password -__v');
    if (!user) throw new Error('User not found');
    return user;
  },

  async getUsers() {
    await connectDB();
    return await User.find({})
      .select('-password -__v')
      .sort({ createdAt: -1 });
  },

  async updateBalance(userId: string, amount: number, transactionData: Partial<ITransaction>) {
    await connectDB();
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.findById(userId).session(session);
      if (!user) throw new Error('User not found');

      const newBalance = user.balance + amount;
      if (newBalance < 0) throw new Error('Insufficient funds');

      const transaction: ITransaction = {
        type: transactionData.type!,
        amount: Math.abs(amount),
        description: transactionData.description!,
        date: new Date(), // Using Date type
        balanceAfter: newBalance,
        relatedUser: transactionData.relatedUser,
        currency: transactionData.currency || 'USD',
      };

      user.balance = newBalance;
      user.transactions.push(transaction);
      await user.save({ session });

      await session.commitTransaction();
      return user;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  async updateBitcoinBalance(userId: string, amount: number, transactionData: Partial<ITransaction>) {
    await connectDB();
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.findById(userId).session(session);
      if (!user) throw new Error('User not found');

      const newBalance = user.btcBalance + amount;
      if (newBalance < 0) throw new Error('Insufficient Bitcoin balance');

      const transaction: ITransaction = {
        type: transactionData.type!,
        amount: Math.abs(amount),
        description: transactionData.description!,
        date: new Date(), // Using Date type
        balanceAfter: newBalance,
        relatedUser: transactionData.relatedUser,
        currency: transactionData.currency || 'BTC',
      };

      user.btcBalance = newBalance;
      user.transactions.push(transaction);
      await user.save({ session });

      await session.commitTransaction();
      return user;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  async getTransactions(userId: string, limit = 10, page = 1) {
    await connectDB();
    const user = await User.findById(userId)
      .select('transactions')
      .slice('transactions', [(page - 1) * limit, limit])
      .sort({ 'transactions.date': -1 });

    if (!user) throw new Error('User not found');
    return user.transactions;
  },
};

// Connection Events
mongoose.connection.on('connected', () => console.log('🟢 Mongoose connected to DB'));
mongoose.connection.on('error', (err) => console.error('🔴 Mongoose connection error:', err));
mongoose.connection.on('disconnected', () => console.log('🟡 Mongoose disconnected'));

export default connectDB;