import mongoose, { ConnectOptions } from 'mongoose';
import User from '@/models/User';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://jp87er:OyDiyQgYTV2yOcQV@justimagine.scciqgh.mongodb.net/bankdb?retryWrites=true&w=majority';

declare global {
  var mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
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
        console.log('✅ MongoDB connected successfully');
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

// Database operations
export const db = {
  // User operations
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
    const user = await User.findByIdAndDelete(userId)
      .select('-password -__v');

    if (!user) throw new Error('User not found');
    return user;
  },

  async getUsers() {
    await connectDB();
    return await User.find({})
      .select('-password -__v')
      .sort({ createdAt: -1 });
  },

  // Account operations
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
        date: new Date(),
        balanceAfter: newBalance,
        ...(transactionData.relatedUser && { relatedUser: transactionData.relatedUser })
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

  // Bitcoin operations
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
        date: new Date(),
        balanceAfter: newBalance,
        ...(transactionData.relatedUser && { relatedUser: transactionData.relatedUser })
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

  // Transaction history
  async getTransactions(userId: string, limit = 10, page = 1) {
    await connectDB();
    const user = await User.findById(userId)
      .select('transactions')
      .slice('transactions', [(page - 1) * limit, limit])
      .sort({ 'transactions.date': -1 });

    if (!user) throw new Error('User not found');
    return user.transactions;
  }
};

// Connection event handlers
mongoose.connection.on('connected', () => 
  console.log('Mongoose connected to DB'));

mongoose.connection.on('error', (err) => 
  console.error('Mongoose connection error:', err));

mongoose.connection.on('disconnected', () => 
  console.log('Mongoose disconnected'));

export default connectDB;