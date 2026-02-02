// models/CheckDeposit.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ICheckDeposit extends Document {
  userId: mongoose.Types.ObjectId;
  userEmail: string;
  userName: string;
  accountType: 'checking' | 'savings';
  amount: number;
  checkNumber?: string;
  frontImage: string;
  backImage: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CheckDepositSchema = new Schema<ICheckDeposit>(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true 
    },
    userEmail: { type: String, required: true },
    userName: { type: String, required: true },
    accountType: { 
      type: String, 
      enum: ['checking', 'savings'], 
      required: true 
    },
    amount: { type: Number, required: true, min: 0.01 },
    checkNumber: { type: String },
    frontImage: { type: String, required: true },
    backImage: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected'], 
      default: 'pending',
      index: true
    },
    rejectionReason: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

// Index for efficient queries
CheckDepositSchema.index({ status: 1, createdAt: -1 });
CheckDepositSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.CheckDeposit || mongoose.model<ICheckDeposit>('CheckDeposit', CheckDepositSchema);