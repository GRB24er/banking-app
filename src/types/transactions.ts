export interface ITransaction {
  type: string;
  amount: number;
  description: string;
  date: Date;
  balanceAfter: number;
  relatedUser?: string;
}