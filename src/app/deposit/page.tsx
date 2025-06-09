'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './deposit.module.css';

interface ApiResponse {
  success: boolean;
  transactionId: string;
  message?: string;
}

export default function DepositPage() {
  const router = useRouter();

  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<ApiResponse | null>(null);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessData(null);

    if (!amount || Number(amount) <= 0) {
      setErrorMsg('Please enter a valid amount.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/transactions/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(amount) }),
      });
      const data: ApiResponse = await res.json();
      setLoading(false);

      if (!data.success) {
        setErrorMsg(data.message || 'Deposit failed.');
        return;
      }

      setSuccessData(data);
      setAmount('');
    } catch (err) {
      console.error(err);
      setLoading(false);
      setErrorMsg('Network or server error. Please try again.');
    }
  };

  return (
    <div className={styles.container}>
      {/* ← Back button */}
      <div className={styles.navBack}>
        <button
          onClick={() => router.back()}
          className={styles.backButton}
        >
          ← Back
        </button>
      </div>

      <h1 className={styles.title}>Deposit Funds</h1>

      {errorMsg && <div className={styles.errorMsg}>{errorMsg}</div>}
      {successData && (
        <div className={styles.successBox}>
          <p>✅ Deposit Successful!</p>
          <p>
            Transaction ID: <strong>{successData.transactionId}</strong>
          </p>
          <p>A confirmation email has been sent.</p>
        </div>
      )}

      <form onSubmit={handleDeposit} className={styles.form}>
        <div className={styles.formField}>
          <label htmlFor="amount">Amount (USD)</label>
          <input
            id="amount"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 250.00"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={styles.submitBtn}
        >
          {loading ? 'Processing…' : 'Deposit'}
        </button>
      </form>
    </div>
  );
}
