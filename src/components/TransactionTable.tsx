"use client";

import React from "react";
import styles from "./TransactionTable.module.css";
import { motion } from "framer-motion";

/** Keep this named export so your page can import the type */
export interface Transaction {
  id: string;
  description: string;
  amount: number;
  status: string;
  date: string;
  category: string;
}

/** Default export for the component itself */
export default function TransactionTable({
  transactions,
}: {
  transactions: Transaction[];
}) {
  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h3 className={styles.header}>Recent Transactions</h3>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.left}>Transaction</th>
              <th>Amount (USD)</th>
              <th>Status</th>
              <th>Date</th>
              <th className={styles.right}>Account</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, idx) => (
              <tr
                key={`${tx.id}-${idx}`}
                className={idx % 2 === 0 ? styles.rowEven : styles.rowOdd}
              >
                <td className={styles.left}>{tx.description}</td>
                <td className={tx.amount < 0 ? styles.debit : styles.credit}>
                  ${Math.abs(tx.amount).toFixed(2)}
                </td>
                <td>
                  <span
                    className={[
                      styles.statusPill,
                      tx.status === "Completed"
                        ? styles.completed
                        : tx.status === "Pending"
                        ? styles.pending
                        : styles.failed,
                    ].join(" ")}
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
    </motion.div>
  );
}
