import mongoose from 'mongoose';

export interface ITransaction {
  id?: string;
  _id?: mongoose.Types.ObjectId;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'debit' | 'credit';
  amount: number;
  description: string;
  date: Date;
  balanceAfter: number;
  relatedUser?: mongoose.Types.ObjectId | string;
  currency?: string;
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  reference: string;
  metadata?: Record<string, any>;
}