import mongoose from 'mongoose';

export interface ITransaction {
  id?: string;
  _id?: mongoose.Types.ObjectId;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'debit' | 'credit';
  amount: number;
  description: string;
  date: Date;
  balanceAfter: number;
  relatedUser?: mongoose.Types.ObjectId;
  currency?: string;
}