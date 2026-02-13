// src/lib/currencyService.ts
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';

// ============================================
// SUPPORTED CURRENCIES
// ============================================
export const SUPPORTED_CURRENCIES = {
  // Major Currencies
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', decimals: 2 },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', decimals: 2 },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', decimals: 2 },
  CHF: { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭', decimals: 2 },
  JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', decimals: 0 },
  CAD: { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦', decimals: 2 },
  AUD: { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', decimals: 2 },
  NZD: { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿', decimals: 2 },
  
  // Asian Currencies
  CNY: { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳', decimals: 2 },
  HKD: { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰', decimals: 2 },
  SGD: { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬', decimals: 2 },
  KRW: { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷', decimals: 0 },
  INR: { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳', decimals: 2 },
  THB: { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭', decimals: 2 },
  MYR: { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾', decimals: 2 },
  IDR: { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩', decimals: 0 },
  PHP: { code: 'PHP', name: 'Philippine Peso', symbol: '₱', flag: '🇵🇭', decimals: 2 },
  VND: { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', flag: '🇻🇳', decimals: 0 },
  
  // European Currencies
  SEK: { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪', decimals: 2 },
  NOK: { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴', decimals: 2 },
  DKK: { code: 'DKK', name: 'Danish Krone', symbol: 'kr', flag: '🇩🇰', decimals: 2 },
  PLN: { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', flag: '🇵🇱', decimals: 2 },
  CZK: { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', flag: '🇨🇿', decimals: 2 },
  HUF: { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', flag: '🇭🇺', decimals: 0 },
  RON: { code: 'RON', name: 'Romanian Leu', symbol: 'lei', flag: '🇷🇴', decimals: 2 },
  BGN: { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв', flag: '🇧🇬', decimals: 2 },
  HRK: { code: 'HRK', name: 'Croatian Kuna', symbol: 'kn', flag: '🇭🇷', decimals: 2 },
  RUB: { code: 'RUB', name: 'Russian Ruble', symbol: '₽', flag: '🇷🇺', decimals: 2 },
  TRY: { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷', decimals: 2 },
  
  // Middle East & Africa
  AED: { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪', decimals: 2 },
  SAR: { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', flag: '🇸🇦', decimals: 2 },
  QAR: { code: 'QAR', name: 'Qatari Riyal', symbol: '﷼', flag: '🇶🇦', decimals: 2 },
  KWD: { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', flag: '🇰🇼', decimals: 3 },
  BHD: { code: 'BHD', name: 'Bahraini Dinar', symbol: '.د.ب', flag: '🇧🇭', decimals: 3 },
  OMR: { code: 'OMR', name: 'Omani Rial', symbol: '﷼', flag: '🇴🇲', decimals: 3 },
  ILS: { code: 'ILS', name: 'Israeli Shekel', symbol: '₪', flag: '🇮🇱', decimals: 2 },
  EGP: { code: 'EGP', name: 'Egyptian Pound', symbol: '£', flag: '🇪🇬', decimals: 2 },
  ZAR: { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦', decimals: 2 },
  NGN: { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬', decimals: 2 },
  KES: { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', flag: '🇰🇪', decimals: 2 },
  GHS: { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', flag: '🇬🇭', decimals: 2 },
  
  // Americas
  MXN: { code: 'MXN', name: 'Mexican Peso', symbol: '$', flag: '🇲🇽', decimals: 2 },
  BRL: { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷', decimals: 2 },
  ARS: { code: 'ARS', name: 'Argentine Peso', symbol: '$', flag: '🇦🇷', decimals: 2 },
  CLP: { code: 'CLP', name: 'Chilean Peso', symbol: '$', flag: '🇨🇱', decimals: 0 },
  COP: { code: 'COP', name: 'Colombian Peso', symbol: '$', flag: '🇨🇴', decimals: 0 },
  PEN: { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/', flag: '🇵🇪', decimals: 2 },
  
  // Crypto
  BTC: { code: 'BTC', name: 'Bitcoin', symbol: '₿', flag: '🪙', decimals: 8 },
  ETH: { code: 'ETH', name: 'Ethereum', symbol: 'Ξ', flag: '🪙', decimals: 8 },
  USDT: { code: 'USDT', name: 'Tether USD', symbol: '₮', flag: '🪙', decimals: 2 },
  USDC: { code: 'USDC', name: 'USD Coin', symbol: 'USDC', flag: '🪙', decimals: 2 },
};

export type CurrencyCode = keyof typeof SUPPORTED_CURRENCIES;

// ============================================
// EXCHANGE RATE MODEL
// ============================================
const ExchangeRateSchema = new mongoose.Schema({
  baseCurrency: { type: String, required: true },
  targetCurrency: { type: String, required: true },
  rate: { type: Number, required: true },
  inverseRate: { type: Number, required: true },
  source: { type: String, default: 'manual' }, // 'api', 'manual'
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

ExchangeRateSchema.index({ baseCurrency: 1, targetCurrency: 1 }, { unique: true });

const ExchangeRate = mongoose.models.ExchangeRate || mongoose.model('ExchangeRate', ExchangeRateSchema);

// ============================================
// DEFAULT EXCHANGE RATES (USD base)
// ============================================
const DEFAULT_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  CHF: 0.88,
  JPY: 149.50,
  CAD: 1.36,
  AUD: 1.53,
  NZD: 1.64,
  CNY: 7.24,
  HKD: 7.82,
  SGD: 1.34,
  KRW: 1320.00,
  INR: 83.12,
  THB: 35.50,
  MYR: 4.72,
  IDR: 15650.00,
  PHP: 56.20,
  VND: 24500.00,
  SEK: 10.45,
  NOK: 10.62,
  DKK: 6.87,
  PLN: 4.02,
  CZK: 23.15,
  HUF: 358.00,
  RON: 4.58,
  BGN: 1.80,
  HRK: 6.95,
  RUB: 92.50,
  TRY: 32.15,
  AED: 3.67,
  SAR: 3.75,
  QAR: 3.64,
  KWD: 0.31,
  BHD: 0.38,
  OMR: 0.38,
  ILS: 3.65,
  EGP: 30.90,
  ZAR: 18.75,
  NGN: 1550.00,
  KES: 153.50,
  GHS: 12.50,
  MXN: 17.15,
  BRL: 4.97,
  ARS: 870.00,
  CLP: 925.00,
  COP: 4050.00,
  PEN: 3.72,
  BTC: 0.000024,
  ETH: 0.00042,
  USDT: 1.00,
  USDC: 1.00,
};

// ============================================
// INITIALIZE EXCHANGE RATES
// ============================================
export async function initializeExchangeRates(): Promise<void> {
  await connectDB();

  for (const [currency, rate] of Object.entries(DEFAULT_RATES)) {
    if (currency === 'USD') continue;

    await ExchangeRate.findOneAndUpdate(
      { baseCurrency: 'USD', targetCurrency: currency },
      {
        baseCurrency: 'USD',
        targetCurrency: currency,
        rate: rate,
        inverseRate: 1 / rate,
        source: 'default',
      },
      { upsert: true, new: true }
    );
  }

  console.log('[Currency] Exchange rates initialized');
}

// ============================================
// GET EXCHANGE RATE
// ============================================
export async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string
): Promise<{ rate: number; inverseRate: number; updatedAt: Date } | null> {
  if (fromCurrency === toCurrency) {
    return { rate: 1, inverseRate: 1, updatedAt: new Date() };
  }

  await connectDB();

  // Try direct rate
  let rateDoc = await ExchangeRate.findOne({
    baseCurrency: fromCurrency,
    targetCurrency: toCurrency,
  });

  if (rateDoc) {
    return {
      rate: rateDoc.rate,
      inverseRate: rateDoc.inverseRate,
      updatedAt: rateDoc.updatedAt,
    };
  }

  // Try inverse rate
  rateDoc = await ExchangeRate.findOne({
    baseCurrency: toCurrency,
    targetCurrency: fromCurrency,
  });

  if (rateDoc) {
    return {
      rate: rateDoc.inverseRate,
      inverseRate: rateDoc.rate,
      updatedAt: rateDoc.updatedAt,
    };
  }

  // Try through USD
  if (fromCurrency !== 'USD' && toCurrency !== 'USD') {
    const fromUSD = await ExchangeRate.findOne({
      baseCurrency: 'USD',
      targetCurrency: fromCurrency,
    });
    const toUSD = await ExchangeRate.findOne({
      baseCurrency: 'USD',
      targetCurrency: toCurrency,
    });

    if (fromUSD && toUSD) {
      const rate = toUSD.rate / fromUSD.rate;
      return {
        rate,
        inverseRate: 1 / rate,
        updatedAt: new Date(Math.min(fromUSD.updatedAt.getTime(), toUSD.updatedAt.getTime())),
      };
    }
  }

  return null;
}

// ============================================
// CONVERT CURRENCY
// ============================================
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<{
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  targetCurrency: string;
  rate: number;
  fee: number;
  totalDeducted: number;
} | null> {
  const rateInfo = await getExchangeRate(fromCurrency, toCurrency);

  if (!rateInfo) {
    return null;
  }

  const convertedAmount = amount * rateInfo.rate;
  const currencyInfo = SUPPORTED_CURRENCIES[toCurrency as CurrencyCode];
  const decimals = currencyInfo?.decimals ?? 2;

  // Calculate fee (0.5% for currency exchange)
  const feeRate = 0.005;
  const fee = amount * feeRate;

  return {
    originalAmount: amount,
    originalCurrency: fromCurrency,
    convertedAmount: parseFloat(convertedAmount.toFixed(decimals)),
    targetCurrency: toCurrency,
    rate: rateInfo.rate,
    fee: parseFloat(fee.toFixed(2)),
    totalDeducted: parseFloat((amount + fee).toFixed(2)),
  };
}

// ============================================
// UPDATE EXCHANGE RATE
// ============================================
export async function updateExchangeRate(
  baseCurrency: string,
  targetCurrency: string,
  rate: number,
  source: 'api' | 'manual' = 'manual'
): Promise<any> {
  await connectDB();

  return ExchangeRate.findOneAndUpdate(
    { baseCurrency, targetCurrency },
    {
      baseCurrency,
      targetCurrency,
      rate,
      inverseRate: 1 / rate,
      source,
      updatedAt: new Date(),
    },
    { upsert: true, new: true }
  );
}

// ============================================
// GET ALL EXCHANGE RATES
// ============================================
export async function getAllExchangeRates(baseCurrency: string = 'USD'): Promise<any[]> {
  await connectDB();

  const rates = await ExchangeRate.find({ baseCurrency }).sort({ targetCurrency: 1 });

  return rates.map(r => ({
    currency: r.targetCurrency,
    rate: r.rate,
    inverseRate: r.inverseRate,
    updatedAt: r.updatedAt,
    ...SUPPORTED_CURRENCIES[r.targetCurrency as CurrencyCode],
  }));
}

// ============================================
// FORMAT CURRENCY
// ============================================
export function formatCurrency(
  amount: number,
  currencyCode: string,
  options?: { showSymbol?: boolean; showCode?: boolean }
): string {
  const currency = SUPPORTED_CURRENCIES[currencyCode as CurrencyCode];
  const decimals = currency?.decimals ?? 2;
  const symbol = currency?.symbol || currencyCode;

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);

  if (options?.showCode) {
    return `${formatted} ${currencyCode}`;
  }

  if (options?.showSymbol !== false) {
    return `${symbol}${formatted}`;
  }

  return formatted;
}

// ============================================
// GET CURRENCY INFO
// ============================================
export function getCurrencyInfo(currencyCode: string) {
  return SUPPORTED_CURRENCIES[currencyCode as CurrencyCode] || null;
}

// ============================================
// GET ALL CURRENCIES
// ============================================
export function getAllCurrencies() {
  return Object.values(SUPPORTED_CURRENCIES);
}

// ============================================
// FETCH LIVE RATES (from external API)
// ============================================
export async function fetchLiveRates(): Promise<boolean> {
  try {
    // Using exchangerate-api.com free tier
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await response.json();

    if (data.rates) {
      await connectDB();

      for (const [currency, rate] of Object.entries(data.rates)) {
        if (SUPPORTED_CURRENCIES[currency as CurrencyCode]) {
          await updateExchangeRate('USD', currency, rate as number, 'api');
        }
      }

      console.log('[Currency] Live rates updated from API');
      return true;
    }

    return false;
  } catch (error) {
    console.error('[Currency] Failed to fetch live rates:', error);
    return false;
  }
}
