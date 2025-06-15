export interface ITransaction {
  id: string; // Frontend-safe string version of Mongo _id
  type: string;
  amount: number;
  description: string;
  date: string; // Always string for frontend safety ('YYYY-MM-DD')
  balanceAfter: number;
  relatedUser?: string;
  currency?: string; // optional if you support USD, BTC, etc.
}
