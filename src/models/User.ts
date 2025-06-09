import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ITransaction {
  type: 'deposit' | 'withdrawal' | 'transfer' | 'debit' | 'credit';
  amount: number;
  description: string;
  date: Date;
  balanceAfter: number;
  relatedUser?: mongoose.Types.ObjectId;
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
}

const TransactionSchema: Schema<ITransaction> = new Schema({
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'transfer', 'debit', 'credit'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  relatedUser: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
});

const UserSchema: Schema<IUser> = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  verified: {
    type: Boolean,
    default: false
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  btcBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  accountNumber: {
    type: String,
    required: true,
    unique: true
  },
  routingNumber: {
    type: String,
    required: true
  },
  bitcoinAddress: {
    type: String,
    required: true,
    unique: true
  },
  transactions: [TransactionSchema]
}, {
  timestamps: true
});

// Add index for frequently queried fields
UserSchema.index({ email: 1 });
UserSchema.index({ accountNumber: 1 });
UserSchema.index({ bitcoinAddress: 1 });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;