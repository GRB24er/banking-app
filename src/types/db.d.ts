import { Document, Model } from 'mongoose';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      MONGODB_URI: string;
      NODE_ENV: 'development' | 'production' | 'test';
    }
  }

  var mongoose: {
    conn: typeof import('mongoose') | null;
    promise: Promise<typeof import('mongoose')> | null;
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