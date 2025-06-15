// src/components/RecentActivity/index.tsx
import { Transaction } from '@/types/transaction';

interface RecentActivityProps {
  transactions: Transaction[];
}

export default function RecentActivity({ transactions }: RecentActivityProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-700">Recent Transactions</h3>
      <ul className="space-y-2">
        {transactions.map((transaction) => (
          <li key={transaction.id} className="flex justify-between">
            <span>{transaction.type}</span>
            <span>${transaction.amount.toFixed(2)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}