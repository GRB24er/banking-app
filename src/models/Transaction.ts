// File: src/models/Transaction.ts
import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'deposit' | 'send' | 'transfer_usd' | 'transfer_btc';
  currency: 'USD' | 'BTC';
  amount: number;
  date: Date;
  description?: string;
}

const TransactionSchema: Schema<ITransaction> = new mongoose.Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['deposit', 'send', 'transfer_usd', 'transfer_btc'],
      required: true,
    },
    currency: {
      type: String,
      enum: ['USD', 'BTC'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      default: () => new Date(),
    },
    description: {
      type: String,
    },
  },
  { timestamps: true }
);

const Transaction: Model<ITransaction> =
  mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);

export default Transaction;
