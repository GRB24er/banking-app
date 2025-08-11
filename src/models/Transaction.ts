// src/models/Transaction.ts
import mongoose, { Document, Model, Schema } from 'mongoose';
import User from '@/models/User';

export type AccountType = 'checking' | 'savings' | 'investment';
export type Currency = 'USD' | 'BTC';
export type TxType = 'deposit' | 'send' | 'transfer_usd' | 'transfer_btc';

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: TxType;
  currency: Currency;
  amount: number;
  date: Date;
  description?: string;

  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: mongoose.Types.ObjectId | null;
  reviewedAt?: Date | null;
  originalDate?: Date | null;
  editedDateByAdmin?: boolean;

  posted: boolean; // whether balances were applied
  postedAt?: Date | null;

  accountType: AccountType;
}

const TransactionSchema: Schema<ITransaction> = new mongoose.Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['deposit', 'send', 'transfer_usd', 'transfer_btc'], required: true },
    currency: { type: String, enum: ['USD', 'BTC'], required: true, default: 'USD' },
    amount: { type: Number, required: true },
    date: { type: Date, default: () => new Date() },
    description: { type: String },

    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    originalDate: { type: Date, default: null },
    editedDateByAdmin: { type: Boolean, default: false },

    posted: { type: Boolean, default: false, index: true },
    postedAt: { type: Date, default: null },

    accountType: { type: String, enum: ['checking', 'savings', 'investment'], default: 'checking', index: true },
  },
  { timestamps: true }
);

// ---------- helpers ----------
function deltaUSD(type: TxType, currency: Currency, amount: number) {
  if (currency !== 'USD') return 0;
  switch (type) {
    case 'deposit': return amount;
    case 'send': return -amount;
    case 'transfer_usd': return -amount;
    default: return 0;
  }
}
function mapEmbeddedType(t: TxType): 'deposit' | 'withdrawal' | 'transfer' | 'debit' | 'credit' {
  switch (t) {
    case 'deposit': return 'deposit';
    case 'send': return 'withdrawal';
    case 'transfer_usd':
    case 'transfer_btc': return 'transfer';
    default: return 'deposit';
  }
}
const toNum = (v: any) => (typeof v === 'number' ? v : Number(v ?? 0)) || 0;

// Record a PENDING line in embedded history (balanceAfter = current BEFORE value)
async function recordPendingOnce(doc: ITransaction) {
  const user: any = await User.findById(doc.userId);
  if (!user) return;

  // ensure rollups exist
  if (typeof user.balance !== 'number') user.balance = 0;
  if (typeof user.savingsBalance !== 'number') user.savingsBalance = 0;
  if (typeof user.investmentBalance !== 'number') user.investmentBalance = 0;

  const acct = (doc.accountType as AccountType) || 'checking';
  const before =
    acct === 'savings' ? user.savingsBalance :
    acct === 'investment' ? user.investmentBalance :
    user.balance;

  user.transactions = Array.isArray(user.transactions) ? user.transactions : [];
  const exists = user.transactions.some((t: any) => String(t._id || t.id) === String(doc._id));
  if (exists) return; // already recorded

  user.transactions.push({
    _id: doc._id,
    type: mapEmbeddedType(doc.type as TxType), // 'deposit' | 'withdrawal' | 'transfer'
    amount: toNum(doc.amount),
    description: doc.description || '',
    date: doc.date || (doc as any).createdAt,
    status: 'pending',              // helps UI label it
    balanceAfter: before,           // schema wants this; using BEFORE value while pending
    relatedUser: null,
    accountType: acct,
    currency: doc.currency,
  });

  await user.save();
}

// Apply APPROVED effect once: post balances + upgrade embedded entry
async function applyPostingOnce(doc: ITransaction | null) {
  if (!doc) return;
  if (doc.status !== 'approved' || doc.posted) return;

  const user: any = await User.findById(doc.userId);
  if (!user) return;

  // Ensure rollups exist
  if (typeof user.balance !== 'number') user.balance = 0;
  if (typeof user.savingsBalance !== 'number') user.savingsBalance = 0;
  if (typeof user.investmentBalance !== 'number') user.investmentBalance = 0;

  const acct = (doc.accountType as AccountType) || 'checking';
  const dUSD = deltaUSD(doc.type as TxType, doc.currency as Currency, toNum(doc.amount));

  const before =
    acct === 'savings' ? user.savingsBalance :
    acct === 'investment' ? user.investmentBalance :
    user.balance;

  const after = before + dUSD;

  if (acct === 'savings')      user.savingsBalance    = after;
  else if (acct === 'investment') user.investmentBalance = after;
  else                           user.balance          = after;

  // Upgrade (or create) embedded entry to approved + set final balanceAfter
  user.transactions = Array.isArray(user.transactions) ? user.transactions : [];
  const idx = user.transactions.findIndex((t: any) => String(t._id || t.id) === String(doc._id));

  if (idx >= 0) {
    const ref = user.transactions[idx];
    ref.status = 'approved';
    ref.balanceAfter = after;       // final, post-approval balance
    ref.date = doc.date || (doc as any).createdAt;
  } else {
    // if somehow missing pending, create approved line
    user.transactions.push({
      _id: doc._id,
      type: mapEmbeddedType(doc.type as TxType),
      amount: toNum(doc.amount),
      description: doc.description || '',
      date: doc.date || (doc as any).createdAt,
      status: 'approved',
      balanceAfter: after,
      relatedUser: null,
      accountType: acct,
      currency: doc.currency,
    });
  }

  await user.save();

  // mark posted so this never applies twice
  await (doc as any).updateOne({ $set: { posted: true, postedAt: new Date() } });
}

// ---------- guards & hooks ----------

// New tx → force pending + unposted + normalized accountType
TransactionSchema.pre('validate', function (next) {
  if (this.isNew) {
    this.set('status', 'pending');
    this.set('posted', false);
    this.set('postedAt', null);
    const acct = String(this.get('accountType') || 'checking').toLowerCase();
    this.set('accountType', ['checking', 'savings', 'investment'].includes(acct) ? acct : 'checking');
  }
  next();
});

// Catch bulk inserts too
TransactionSchema.pre('insertMany', function (next, docs: any[]) {
  for (const d of docs) {
    d.status = 'pending';
    d.posted = false;
    d.postedAt = null;
    const acct = String(d.accountType || 'checking').toLowerCase();
    d.accountType = ['checking', 'savings', 'investment'].includes(acct) ? acct : 'checking';
  }
  next();
});

// save(): create → record pending; approve → post once
TransactionSchema.post('save', function (doc) {
  const d = doc as ITransaction;
  // If it’s new or still pending, ensure there’s a pending entry
  if (d.isNew || d.status === 'pending') {
    recordPendingOnce(d).catch(err => console.error('recordPending(save):', err));
  }
  // If approved, apply posting
  applyPostingOnce(d).catch(err => console.error('auto-post(save):', err));
});

// findOneAndUpdate(...): after update, record pending if still pending; or post if approved
TransactionSchema.post('findOneAndUpdate', function (doc) {
  const d = doc as ITransaction | null;
  if (!d) return;
  if (d.status === 'pending') {
    recordPendingOnce(d).catch(err => console.error('recordPending(f1u):', err));
  }
  applyPostingOnce(d).catch(err => console.error('auto-post(f1u):', err));
});

// updateOne(...): fetch updated doc and apply same logic
TransactionSchema.post('updateOne', async function () {
  try {
    const filter = (this as any).getFilter ? (this as any).getFilter() : (this as any).getQuery?.();
    if (!filter) return;
    const model = (this as any).model as Model<ITransaction>;
    const doc = await model.findOne(filter);
    if (!doc) return;
    if (doc.status === 'pending') {
      await recordPendingOnce(doc);
    }
    await applyPostingOnce(doc);
  } catch (err) {
    console.error('auto-post(updateOne):', err);
  }
});

const Transaction: Model<ITransaction> =
  mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);

export default Transaction;
