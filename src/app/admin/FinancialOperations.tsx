'use client';

import { useState } from 'react';
import styles from './FinancialOperations.module.css';
import { UserType } from '@/types/user';

interface FinancialOperationsProps {
  users: UserType[];
  refreshUsers: () => void;
}

export default function FinancialOperations({ users, refreshUsers }: FinancialOperationsProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<'USD' | 'BTC'>('USD');
  const [operation, setOperation] = useState<'credit' | 'debit'>('credit');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount)) {
        throw new Error('Please enter a valid amount');
      }

      const response = await fetch('/api/admin/adjust-balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUserId,
          amount: operation === 'credit' ? numericAmount : -numericAmount,
          currency,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to process operation');
      }

      setMessage({ text: 'Operation completed successfully', type: 'success' });
      refreshUsers();
      setAmount('');
    } catch (error: any) {
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Financial Operations</h2>

      {message && (
        <div className={message.type === 'success' ? styles.successMessage : styles.errorMessage}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="user">Select User</label>
          <select
            id="user"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            required
            className={styles.select}
          >
            <option value="">Select a user</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email}) - {user.balance.toFixed(2)} USD / {user.btcBalance.toFixed(6)} BTC
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="operation">Operation</label>
          <select
            id="operation"
            value={operation}
            onChange={(e) => setOperation(e.target.value as 'credit' | 'debit')}
            required
            className={styles.select}
          >
            <option value="credit">Credit (Add)</option>
            <option value="debit">Debit (Subtract)</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="currency">Currency</label>
          <select
            id="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as 'USD' | 'BTC')}
            required
            className={styles.select}
          >
            <option value="USD">USD</option>
            <option value="BTC">BTC</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="amount">Amount</label>
          <input
            id="amount"
            type="number"
            step={currency === 'USD' ? '0.01' : '0.000001'}
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className={styles.input}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !selectedUserId}
          className={styles.submitButton}
        >
          {loading ? 'Processing...' : 'Execute Operation'}
        </button>
      </form>
    </div>
  );
}
