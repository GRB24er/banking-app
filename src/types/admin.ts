export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: 'active' | 'suspended' | 'pending';
  balance?: number;
  createdAt: Date;
}

export interface Transaction {
  _id: string;
  userId: User;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'wire-transfer';
  amount: number;
  status: 'pending' | 'completed' | 'rejected' | 'flagged';
  method?: string;
  toUserId?: User;
  recipient?: string;
  bank?: string;
  account?: string;
  createdAt: Date;
}