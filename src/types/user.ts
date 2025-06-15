// src/types/user.ts
import { Types } from 'mongoose';

export interface BaseUserType {
  name: string;
  email: string;
  role: 'user' | 'admin';
  verified: boolean;
  balance: number;
  btcBalance: number;
  accountNumber: string;
  bitcoinAddress: string;
  transactions?: Array<{
    type: 'deposit' | 'withdrawal' | 'transfer' | 'debit' | 'credit';
    amount: number;
    description: string;
    date: Date;
    balanceAfter: number;
    relatedUser?: Types.ObjectId | string;
  }>;
  formattedBalance?: string;
  formattedBtcBalance?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserType extends BaseUserType {
  id: string;
  _id?: string; // Optional for frontend usage
}

export interface UserDocument extends BaseUserType, Document {
  _id: Types.ObjectId;
  password: string;
}