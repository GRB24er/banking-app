// src/lib/transactionFees.ts
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';

// ============================================
// FEE CONFIGURATION MODEL
// ============================================
const FeeConfigSchema = new mongoose.Schema({
  transactionType: { 
    type: String, 
    required: true, 
    unique: true,
    enum: [
      'internal_transfer',
      'domestic_wire',
      'international_wire',
      'ach_transfer',
      'bitcoin_buy',
      'bitcoin_sell',
      'bitcoin_send',
      'bitcoin_receive',
      'currency_exchange',
      'card_payment',
      'atm_withdrawal',
      'account_maintenance',
      'overdraft',
      'paper_statement',
      'wire_incoming',
      'check_deposit',
    ]
  },
  name: { type: String, required: true },
  description: { type: String },
  feeType: { type: String, enum: ['flat', 'percentage', 'tiered', 'flat_plus_percentage'], required: true },
  flatFee: { type: Number, default: 0 },
  percentageFee: { type: Number, default: 0 }, // e.g., 0.5 = 0.5%
  minFee: { type: Number, default: 0 },
  maxFee: { type: Number }, // Optional cap
  tiers: [{
    minAmount: Number,
    maxAmount: Number,
    flatFee: Number,
    percentageFee: Number,
  }],
  currency: { type: String, default: 'USD' },
  isActive: { type: Boolean, default: true },
  waiveForPremium: { type: Boolean, default: false },
  waiveMinBalance: { type: Number }, // Waive fee if balance above this
}, { timestamps: true });

const FeeConfig = mongoose.models.FeeConfig || mongoose.model('FeeConfig', FeeConfigSchema);

// ============================================
// DEFAULT FEE CONFIGURATIONS
// ============================================
const DEFAULT_FEES = [
  {
    transactionType: 'internal_transfer',
    name: 'Internal Transfer',
    description: 'Transfer between your own accounts',
    feeType: 'flat',
    flatFee: 0,
    isActive: true,
  },
  {
    transactionType: 'domestic_wire',
    name: 'Domestic Wire Transfer',
    description: 'Wire transfer within the country',
    feeType: 'flat',
    flatFee: 25,
    isActive: true,
  },
  {
    transactionType: 'international_wire',
    name: 'International Wire Transfer',
    description: 'Wire transfer to another country',
    feeType: 'flat_plus_percentage',
    flatFee: 45,
    percentageFee: 0.5,
    minFee: 45,
    maxFee: 200,
    isActive: true,
  },
  {
    transactionType: 'ach_transfer',
    name: 'ACH Transfer',
    description: 'Standard bank transfer (3-5 business days)',
    feeType: 'flat',
    flatFee: 0,
    isActive: true,
  },
  {
    transactionType: 'bitcoin_buy',
    name: 'Bitcoin Purchase',
    description: 'Fee for buying Bitcoin',
    feeType: 'percentage',
    percentageFee: 1.5,
    minFee: 1,
    isActive: true,
  },
  {
    transactionType: 'bitcoin_sell',
    name: 'Bitcoin Sale',
    description: 'Fee for selling Bitcoin',
    feeType: 'percentage',
    percentageFee: 1.5,
    minFee: 1,
    isActive: true,
  },
  {
    transactionType: 'bitcoin_send',
    name: 'Bitcoin Send',
    description: 'Fee for sending Bitcoin externally',
    feeType: 'flat_plus_percentage',
    flatFee: 5,
    percentageFee: 0.5,
    minFee: 5,
    isActive: true,
  },
  {
    transactionType: 'bitcoin_receive',
    name: 'Bitcoin Receive',
    description: 'Fee for receiving Bitcoin',
    feeType: 'flat',
    flatFee: 0,
    isActive: true,
  },
  {
    transactionType: 'currency_exchange',
    name: 'Currency Exchange',
    description: 'Fee for exchanging currencies',
    feeType: 'percentage',
    percentageFee: 0.75,
    minFee: 5,
    isActive: true,
  },
  {
    transactionType: 'card_payment',
    name: 'Card Payment',
    description: 'Debit/Credit card transaction',
    feeType: 'flat',
    flatFee: 0,
    isActive: true,
  },
  {
    transactionType: 'atm_withdrawal',
    name: 'ATM Withdrawal',
    description: 'Cash withdrawal from ATM',
    feeType: 'tiered',
    tiers: [
      { minAmount: 0, maxAmount: 500, flatFee: 0, percentageFee: 0 },
      { minAmount: 500.01, maxAmount: 1000, flatFee: 2.50, percentageFee: 0 },
      { minAmount: 1000.01, maxAmount: 999999, flatFee: 5, percentageFee: 0 },
    ],
    isActive: true,
  },
  {
    transactionType: 'account_maintenance',
    name: 'Monthly Account Maintenance',
    description: 'Monthly account fee',
    feeType: 'flat',
    flatFee: 12,
    waiveMinBalance: 5000,
    isActive: true,
  },
  {
    transactionType: 'overdraft',
    name: 'Overdraft Fee',
    description: 'Fee when account goes negative',
    feeType: 'flat',
    flatFee: 35,
    isActive: true,
  },
  {
    transactionType: 'paper_statement',
    name: 'Paper Statement',
    description: 'Monthly paper statement mailing',
    feeType: 'flat',
    flatFee: 5,
    isActive: true,
  },
  {
    transactionType: 'wire_incoming',
    name: 'Incoming Wire',
    description: 'Fee for receiving wire transfers',
    feeType: 'flat',
    flatFee: 15,
    waiveForPremium: true,
    isActive: true,
  },
  {
    transactionType: 'check_deposit',
    name: 'Check Deposit',
    description: 'Mobile or branch check deposit',
    feeType: 'flat',
    flatFee: 0,
    isActive: true,
  },
];

// ============================================
// INITIALIZE DEFAULT FEES
// ============================================
export async function initializeDefaultFees(): Promise<void> {
  await connectDB();
  
  for (const fee of DEFAULT_FEES) {
    await FeeConfig.findOneAndUpdate(
      { transactionType: fee.transactionType },
      fee,
      { upsert: true, new: true }
    );
  }
  
  console.log('[Fees] Default fee configurations initialized');
}

// ============================================
// CALCULATE FEE
// ============================================
export async function calculateFee(
  transactionType: string,
  amount: number,
  options?: {
    isPremiumUser?: boolean;
    userBalance?: number;
  }
): Promise<{
  fee: number;
  feeBreakdown: string;
  feeConfig: any;
}> {
  await connectDB();
  
  const feeConfig = await FeeConfig.findOne({ transactionType, isActive: true });
  
  if (!feeConfig) {
    return { fee: 0, feeBreakdown: 'No fee applicable', feeConfig: null };
  }

  // Check for fee waivers
  if (options?.isPremiumUser && feeConfig.waiveForPremium) {
    return { fee: 0, feeBreakdown: 'Fee waived for premium account', feeConfig };
  }

  if (feeConfig.waiveMinBalance && options?.userBalance && options.userBalance >= feeConfig.waiveMinBalance) {
    return { fee: 0, feeBreakdown: `Fee waived (balance above ${formatCurrency(feeConfig.waiveMinBalance)})`, feeConfig };
  }

  let fee = 0;
  let feeBreakdown = '';

  switch (feeConfig.feeType) {
    case 'flat':
      fee = feeConfig.flatFee;
      feeBreakdown = `Flat fee: ${formatCurrency(fee)}`;
      break;

    case 'percentage':
      fee = (amount * feeConfig.percentageFee) / 100;
      feeBreakdown = `${feeConfig.percentageFee}% of ${formatCurrency(amount)}`;
      break;

    case 'flat_plus_percentage':
      const percentFee = (amount * feeConfig.percentageFee) / 100;
      fee = feeConfig.flatFee + percentFee;
      feeBreakdown = `${formatCurrency(feeConfig.flatFee)} + ${feeConfig.percentageFee}%`;
      break;

    case 'tiered':
      const tier = feeConfig.tiers.find(
        (t: any) => amount >= t.minAmount && amount <= t.maxAmount
      );
      if (tier) {
        fee = tier.flatFee + (amount * tier.percentageFee) / 100;
        feeBreakdown = `Tier: ${formatCurrency(tier.minAmount)} - ${formatCurrency(tier.maxAmount)}`;
      }
      break;
  }

  // Apply min/max
  if (feeConfig.minFee && fee < feeConfig.minFee) {
    fee = feeConfig.minFee;
    feeBreakdown += ` (min fee applied)`;
  }
  if (feeConfig.maxFee && fee > feeConfig.maxFee) {
    fee = feeConfig.maxFee;
    feeBreakdown += ` (max fee applied)`;
  }

  return { fee: Math.round(fee * 100) / 100, feeBreakdown, feeConfig };
}

// ============================================
// GET ALL FEE CONFIGS (for admin)
// ============================================
export async function getAllFeeConfigs(): Promise<any[]> {
  await connectDB();
  return FeeConfig.find({}).sort({ transactionType: 1 });
}

// ============================================
// UPDATE FEE CONFIG (for admin)
// ============================================
export async function updateFeeConfig(
  transactionType: string,
  updates: Partial<typeof DEFAULT_FEES[0]>
): Promise<any> {
  await connectDB();
  return FeeConfig.findOneAndUpdate(
    { transactionType },
    updates,
    { new: true }
  );
}

// ============================================
// HELPER
// ============================================
function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export { FeeConfig };
