import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICryptoBalance {
  currency: string;
  symbol: string;
  balance: number;
  lockedBalance: number;
}

export interface ICryptoWallet extends Document {
  userId: Types.ObjectId;
  balances: Types.DocumentArray<ICryptoBalance>;
  createdAt: Date;
  updatedAt: Date;
  addBalance(symbol: string, currency: string, amount: number): void;
  getBalance(symbol: string): ICryptoBalance | undefined;
  updateBalance(symbol: string, amount: number): boolean;
  lockBalance(symbol: string, amount: number): boolean;
  unlockBalance(symbol: string, amount: number): boolean;
}

const CryptoBalanceSchema = new Schema<ICryptoBalance>({
  currency: { type: String, required: true },
  symbol: { type: String, required: true },
  balance: { type: Number, default: 0 },
  lockedBalance: { type: Number, default: 0 },
}, { _id: false });

const CryptoWalletSchema = new Schema<ICryptoWallet>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    unique: true,
    index: true
  },
  balances: [CryptoBalanceSchema],
}, { timestamps: true });

// Initialize with supported cryptocurrencies
CryptoWalletSchema.pre('save', function(next) {
  if (this.isNew && this.balances.length === 0) {
    const defaultBalances: ICryptoBalance[] = [
      { currency: 'Bitcoin', symbol: 'BTC', balance: 0, lockedBalance: 0 },
      { currency: 'Ethereum', symbol: 'ETH', balance: 0, lockedBalance: 0 },
      { currency: 'Tether', symbol: 'USDT', balance: 0, lockedBalance: 0 },
      { currency: 'USD Coin', symbol: 'USDC', balance: 0, lockedBalance: 0 },
      { currency: 'Binance Coin', symbol: 'BNB', balance: 0, lockedBalance: 0 },
      { currency: 'Ripple', symbol: 'XRP', balance: 0, lockedBalance: 0 },
      { currency: 'Solana', symbol: 'SOL', balance: 0, lockedBalance: 0 },
      { currency: 'Cardano', symbol: 'ADA', balance: 0, lockedBalance: 0 },
    ];
    this.balances.push(...defaultBalances as any);
  }
  next();
});

// Helper method to add balance for a crypto
CryptoWalletSchema.methods.addBalance = function(symbol: string, currency: string, amount: number) {
  const existing = this.balances.find((b: ICryptoBalance) => b.symbol === symbol);
  if (existing) {
    existing.balance += amount;
  } else {
    (this.balances as any).push({
      currency,
      symbol,
      balance: amount,
      lockedBalance: 0,
    });
  }
};

// Get balance for a specific crypto
CryptoWalletSchema.methods.getBalance = function(symbol: string): ICryptoBalance | undefined {
  return this.balances.find((b: ICryptoBalance) => b.symbol === symbol);
};

// Update balance (add or subtract)
CryptoWalletSchema.methods.updateBalance = function(symbol: string, amount: number): boolean {
  const balance = this.balances.find((b: ICryptoBalance) => b.symbol === symbol);
  if (!balance) return false;
  
  const newBalance = balance.balance + amount;
  if (newBalance < 0) return false;
  
  balance.balance = newBalance;
  return true;
};

// Lock balance for pending transfer
CryptoWalletSchema.methods.lockBalance = function(symbol: string, amount: number): boolean {
  const balance = this.balances.find((b: ICryptoBalance) => b.symbol === symbol);
  if (!balance) return false;
  
  const available = balance.balance - balance.lockedBalance;
  if (amount > available) return false;
  
  balance.lockedBalance += amount;
  return true;
};

// Unlock balance (cancel transfer or rejection)
CryptoWalletSchema.methods.unlockBalance = function(symbol: string, amount: number): boolean {
  const balance = this.balances.find((b: ICryptoBalance) => b.symbol === symbol);
  if (!balance) return false;
  
  balance.lockedBalance = Math.max(0, balance.lockedBalance - amount);
  return true;
};

// Static method to get or create wallet
CryptoWalletSchema.statics.getOrCreate = async function(userId: Types.ObjectId) {
  let wallet = await this.findOne({ userId });
  if (!wallet) {
    wallet = await this.create({ userId });
  }
  return wallet;
};

export default mongoose.models.CryptoWallet || mongoose.model<ICryptoWallet>('CryptoWallet', CryptoWalletSchema);