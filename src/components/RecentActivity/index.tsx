// File: src/components/RecentActivity/index.tsx

import React from "react";
import styles from "./RecentActivity.module.css";

export interface RecentTxn {
  id: string;
  type: string;
  currency: string;
  amount: number;
  date: string;
  description: string;
  status: string;
  account: string;
}

interface Props {
  transactions: RecentTxn[];
}

export default function RecentActivity({ transactions }: Props) {
  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Recent Transactions</h2>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Transaction</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
              <th>Account</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn) => (
              <tr key={txn.id}>
                <td className={styles.txnCell}>
                  {/* Reference your SVG in public/icons/transaction.svg */}
                  <img
                    src="/icons/transaction.svg"
                    alt=""
                    className={styles.icon}
                  />
                  <span>{txn.description || txn.type}</span>
                </td>
                <td>${txn.amount.toFixed(2)}</td>
                <td>
                  <span
                    className={`${styles.statusPill} ${
                      txn.status === "Completed"
                        ? styles.completed
                        : txn.status === "Failed"
                        ? styles.failed
                        : styles.pending
                    }`}
                  >
                    {txn.status}
                  </span>
                </td>
                <td>{new Date(txn.date).toLocaleString()}</td>
                <td className={styles.account}>{txn.account}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
