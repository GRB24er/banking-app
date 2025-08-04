"use client";

import React from "react";
import styles from "./TransactionTable.module.css";
import AppIcon from "@/components/AppIcon";
import { motion } from "framer-motion";

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  currency: "USD" | "BTC";
  status: "Completed" | "Pending" | "Failed";
  date: string;
  category: string;
  icon?: string; // file name of icon
}

interface TransactionTableProps {
  transactions: Transaction[];
}

export const TransactionTable: React.FC<TransactionTableProps> = ({ transactions }) => (
  <motion.div
    className={styles.tableContainer}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
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
        {transactions.map((tx, index) => (
          <motion.tr
            key={tx.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <td className={styles.left}>
              <div className={styles.txnCell}>
                <AppIcon name={tx.icon || "transaction"} />
                <span>{tx.description}</span>
              </div>
            </td>
            <td className={tx.amount < 0 ? styles.debit : styles.credit}>
              {tx.currency === "USD" ? "$" : ""}
              {Math.abs(tx.amount).toFixed(2)}
            </td>
            <td>
              <span
                className={[
                  styles.status,
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
          </motion.tr>
        ))}
      </tbody>
    </table>
  </motion.div>
);
