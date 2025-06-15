import { ITransaction } from '@/types/transaction';

interface RecentActivityProps {
  transactions: ITransaction[];
}

export default function RecentActivity({ transactions }: RecentActivityProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-700">Recent Transactions</h3>
      <ul className="space-y-2">
        {transactions.map((transaction) => (
          <li key={transaction.id} className="flex justify-between text-sm">
            <span>{transaction.type}</span>
            <span>
              {transaction.currency === 'USD' ? '$' : ''}
              {transaction.amount.toFixed(2)}
              {transaction.currency && transaction.currency !== 'USD' ? ` ${transaction.currency}` : ''}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
