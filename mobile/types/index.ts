export interface User {
  id: string;
  _id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  verified: boolean;
  accountNumber: string;
  routingNumber: string;
  checkingBalance: number;
  savingsBalance: number;
  investmentBalance: number;
  balance: number;
}

export interface Transaction {
  _id: string;
  reference: string;
  type: string;
  amount: number;
  rawAmount?: number;
  description: string;
  status: string;
  date: string;
  createdAt: string;
  accountType: string;
  posted: boolean;
  currency: string;
}

export interface Card {
  _id: string;
  type: string;
  cardNumber: string;
  maskedNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
  balance: number;
  status: string;
  lastFour: string;
  network: string;
  accountType: string;
}

export interface Transfer {
  _id: string;
  reference: string;
  type: string;
  amount: number;
  status: string;
  date: string;
  accountType: string;
  origin: string;
}

export interface Deposit {
  _id: string;
  amount: number;
  accountType: string;
  status: string;
  checkFrontImage: boolean;
  checkBackImage: boolean;
  reference: string;
  createdAt: string;
  reviewedAt: string | null;
  reviewNote: string | null;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasMore: boolean;
}
