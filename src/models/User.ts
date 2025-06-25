// File: src/models/User.ts

import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

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
  /** ← new: distinguish between regular users & admins */
  role: 'user' | 'admin';
  verified: boolean;
  balance: number;
  btcBalance: number;
  accountNumber: string;
  routingNumber: string;
  bitcoinAddress: string;
  transactions: ITransaction[];
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const TransactionSchema = new Schema<ITransaction>({
  type:        { type: String, enum: ['deposit','withdrawal','transfer','debit','credit'], required: true },
  amount:      { type: Number, required: true },
  description: { type: String, required: true },
  date:        { type: Date,   default: Date.now },
  balanceAfter:{ type: Number, required: true },
  relatedUser: { type: Schema.Types.ObjectId, ref: 'User' },
}, { _id: false });

const UserSchema = new Schema<IUser>({
  name:           { type: String, required: true, trim: true, maxlength: 50 },
  email:          { 
                   type: String, required: true, unique: true,
                   match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email']
                  },
  password:       { type: String, required: true, minlength: 8, select: false },

  /** ← NEW FIELD */
  role:           { type: String, enum: ['user','admin'], default: 'user' },

  verified:       { type: Boolean, default: false },
  balance:        { type: Number, default: 0, min: 0 },
  btcBalance:     { type: Number, default: 0, min: 0 },
  accountNumber:  { type: String, required: true, unique: true },
  routingNumber:  { type: String, required: true },
  bitcoinAddress: { type: String, required: true, unique: true },
  transactions:   [TransactionSchema]
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.password;
      delete ret.__v;
      return ret;
    },
  },
});

// Hash password on save
UserSchema.pre<IUser>('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err as any);
  }
});

// Auto‐generate account, routing & BTC address
UserSchema.pre<IUser>('save', function(next) {
  if (!this.accountNumber)  this.accountNumber  = 'AC' + Math.floor(1e8 + Math.random()*9e8);
  if (!this.routingNumber)  this.routingNumber  = 'RT' + Math.floor(1e8 + Math.random()*9e8);
  if (!this.bitcoinAddress) this.bitcoinAddress = 'bc1' + Math.random().toString(36).slice(2);
  next();
});

UserSchema.methods.comparePassword = function(candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
