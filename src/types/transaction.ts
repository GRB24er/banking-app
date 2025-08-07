// File: src/types/transaction.ts
export interface ITransaction {
  _id?:         string;
  reference:    string;
  type:         'deposit' | 'credit' | 'withdrawal' | 'transfer' | 'send' | string;
  currency:     string;
  amount:       number;
  date:         Date;
  balanceAfter: number;
  status:       'pending' | 'completed' | 'failed' | 'reversed' | string;
  description?: string;
  /**
   * Which user account this transaction hit.
   * 'checking' | 'savings' | 'investment' 
   */
  accountType?: 'checking' | 'savings' | 'investment';
}
