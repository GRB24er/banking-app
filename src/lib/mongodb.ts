// File: src/lib/mongodb.ts
import mongoose, { ConnectOptions } from 'mongoose';
import User from '@/models/User';
import type { ITransaction } from '@/types/transaction';

const MONGODB_URI = 'mongodb+srv://sarahmorganme2844:WWznuJXRceASUfa4@justimagine.pvtpi05.mongodb.net/?retryWrites=true&w=majority&appName=Justimagine';

declare global {
  var _mongoose: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
}
const cached = global._mongoose || { conn: null, promise: null };

export default async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    const opts: ConnectOptions = { bufferCommands: false, autoIndex: process.env.NODE_ENV !== 'production' };
    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then(m => { console.log('✅ MongoDB connected'); return m; })
      .catch(err => { cached.promise = null; console.error('❌ MongoDB connection error:', err); throw err; });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export function generateTransactionReference(prefix = 'txn'): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export const db = {
  async getUserById(id: string) {
    await connectDB();
    return User.findById(id).select('-password -__v');
  },

  async getUserByEmail(email: string) {
    await connectDB();
    return User.findOne({ email }).select('-password -__v');
  },

  async getUserByAccount(accountNumber: string, routingNumber: string) {
    await connectDB();
    return User.findOne({ accountNumber, routingNumber }).select('-password -__v');
  },

  async getUserByBitcoinAddress(bitcoinAddress: string) {
    await connectDB();
    return User.findOne({ bitcoinAddress }).select('-password -__v');
  },

  async verifyUser(userId: string) {
    await connectDB();
    const user = await User.findByIdAndUpdate(userId, { verified: true }, { new: true }).select('-password -__v');
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
    return User.find({}).select('-password -__v').sort({ createdAt: -1 });
  },

  async createTransaction(
    userId: string,
    transactionData: Omit<ITransaction, 'date' | 'balanceAfter' | 'status' | 'reference'>,
    initialStatus: 'pending' | 'completed' = 'completed'
  ) {
    await connectDB();
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const user = await User.findById(userId).session(session);
      if (!user) throw new Error('User not found');

      let newBalance = user.balance;
      if (transactionData.type === 'deposit' || transactionData.type === 'credit') {
        newBalance += transactionData.amount;
      } else {
        newBalance -= transactionData.amount;
        if (newBalance < 0) throw new Error('Insufficient funds');
      }

      const transaction: ITransaction = {
        ...transactionData,
        date: new Date(),
        balanceAfter: newBalance,
        status: initialStatus,
        reference: generateTransactionReference(),
        currency: transactionData.currency || 'USD'
      };

      user.balance = newBalance;
      user.transactions.push(transaction);
      await user.save({ session });
      await session.commitTransaction();
      return { user, transaction };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  async updateTransactionStatus(
    userId: string,
    transactionReference: string,
    newStatus: 'completed' | 'failed' | 'reversed'
  ) {
    await connectDB();
    const user = await User.findOneAndUpdate(
      { _id: userId, 'transactions.reference': transactionReference },
      { $set: { 'transactions.$.status': newStatus } },
      { new: true }
    );
    if (!user) throw new Error('User or transaction not found');
    return user.transactions.find((t: ITransaction) => t.reference === transactionReference);
  },

  async getTransactions(
    userId: string,
    options: {
      limit?: number;
      page?: number;
      status?: ITransaction['status'];
      type?: ITransaction['type'];
      startDate?: Date;
      endDate?: Date;
    } = {}
  ) {
    await connectDB();
    const { limit = 10, page = 1, status, type, startDate, endDate } = options;
    let query = User.findById(userId).select('transactions');
    const filter: any = {};
    if (status)   filter['transactions.status'] = status;
    if (type)     filter['transactions.type']   = type;
    if (startDate || endDate) {
      filter['transactions.date'] = {};
      if (startDate) filter['transactions.date'].$gte = startDate;
      if (endDate)   filter['transactions.date'].$lte = endDate;
    }
    if (Object.keys(filter).length) query = query.where(filter);

    const user = await query
      .slice('transactions', [(page - 1) * limit, limit])
      .sort({ 'transactions.date': -1 });
    if (!user) throw new Error('User not found');
    return user.transactions;
  },

  async createBitcoinTransaction(
    userId: string,
    transactionData: Omit<ITransaction, 'date' | 'balanceAfter' | 'status' | 'reference'>,
    initialStatus: 'pending' | 'completed' = 'completed'
  ) {
    await connectDB();
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const user = await User.findById(userId).session(session);
      if (!user) throw new Error('User not found');

      let newBalance = user.btcBalance;
      if (transactionData.type === 'deposit' || transactionData.type === 'credit') {
        newBalance += transactionData.amount;
      } else {
        newBalance -= transactionData.amount;
        if (newBalance < 0) throw new Error('Insufficient Bitcoin balance');
      }

      const transaction: ITransaction = {
        ...transactionData,
        date: new Date(),
        balanceAfter: newBalance,
        status: initialStatus,
        reference: generateTransactionReference('btc'),
        currency: 'BTC'
      };

      user.btcBalance = newBalance;
      user.transactions.push(transaction);
      await user.save({ session });
      await session.commitTransaction();
      return { user, transaction };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
};

mongoose.connection.on('connected',    () => console.log('🟢 Mongoose connected'));
mongoose.connection.on('error',        err => console.error('🔴 Mongoose connection error:', err));
mongoose.connection.on('disconnected', () => console.log('🟡 Mongoose disconnected'));
