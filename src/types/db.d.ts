import { Document, Model, Connection } from 'mongoose';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      MONGODB_URI: string;
      NODE_ENV: 'development' | 'production' | 'test';
    }
  }

  var mongoose: {
    conn: Connection | null;
    promise: Promise<Connection> | null;
  };
}

export type TransactionType = 'deposit' | 'withdrawal' | 'transfer' | 'debit' | 'credit';

export interface ITransaction {
  type: TransactionType;
  amount: number;
  description: string;
  date: Date;
  balanceAfter: number;
  relatedUser?: string;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  verified: boolean;
  balance: number;
  btcBalance: number;
  accountNumber: string;
  routingNumber: string;
  bitcoinAddress: string;
  transactions: ITransaction[];
  createdAt: Date;
  updatedAt: Date;
  formattedBalance: string;
  formattedBtcBalance: string;
}

export type UserModel = Model<IUser>;

// Database operations interface
export interface Database {
  // User operations
  getUserById(id: string): Promise<IUser | null>;
  getUserByEmail(email: string): Promise<IUser | null>;
  verifyUser(userId: string): Promise<IUser>;
  deleteUser(userId: string): Promise<IUser>;
  getUsers(): Promise<IUser[]>;
  
  // Account operations
  updateBalance(
    userId: string, 
    amount: number, 
    transactionData: Partial<ITransaction>
  ): Promise<IUser>;
  
  // Bitcoin operations
  updateBitcoinBalance(
    userId: string, 
    amount: number, 
    transactionData: Partial<ITransaction>
  ): Promise<IUser>;
  
  // Transaction history
  getTransactions(userId: string, limit?: number, page?: number): Promise<ITransaction[]>;
  
  // Connection
  connectToDB(): Promise<Connection>;
}

// Augment the module declarations
declare module '@/lib/mongodb' {
  export const db: Database;
  export default function connectDB(): Promise<Connection>;
}