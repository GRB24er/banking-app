import React from 'react'
import styles from './TransactionTable.module.css'
import { BanknotesIcon } from '@heroicons/react/24/outline'

export interface Transaction {
  id: string
  description: string
  amount: number
  currency: 'USD' | 'BTC'
  status: 'Completed' | 'Pending' | 'Failed'
  date: string
  category: string
  icon?: React.ReactNode
}

interface TransactionTableProps {
  transactions: Transaction[]
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
}) => (
  <div className={styles.tableContainer}>
    <table className={styles.table}>
      <thead>
        <tr>
          <th className={styles.left}>Transaction</th>
          <th>Amount</th>
          <th>Status</th>
          <th>Date</th>
          <th className={styles.right}>Category</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((tx) => (
          <tr key={tx.id}>
            <td className={styles.left}>
              <div className={styles.txnCell}>
                {tx.icon ?? <BanknotesIcon className={styles.icon} />}
                <span>{tx.description}</span>
              </div>
            </td>
            <td className={tx.amount < 0 ? styles.debit : styles.credit}>
              {tx.currency === 'USD' ? '$' : ''}
              {Math.abs(tx.amount).toFixed(2)}
            </td>
            <td>
              <span
                className={[
                  styles.status,
                  tx.status === 'Completed'
                    ? styles.completed
                    : tx.status === 'Pending'
                    ? styles.pending
                    : styles.failed,
                ].join(' ')}
              >
                {tx.status}
              </span>
            </td>
            <td>{new Date(tx.date).toLocaleString()}</td>
            <td className={styles.right}>{tx.category}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)
