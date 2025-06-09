'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './transfer.module.css';

interface ApiResponse {
  success: boolean;
  transactionId: string;
  message?: string;
}

export default function TransferPage() {
  const router = useRouter();

  const [source, setSource] = useState<'checking' | 'savings' | 'bitcoin'>('checking');
  const [destination, setDestination] = useState<'checking' | 'savings' | 'bitcoin' | 'external'>('savings');
  const [amount, setAmount] = useState('');
  const [isExternal, setIsExternal] = useState(false);
  const [extAccount, setExtAccount] = useState('');
  const [extRouting, setExtRouting] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<ApiResponse | null>(null);

  useEffect(() => {
    setIsExternal(destination === 'external');
  }, [destination]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessData(null);

    if (source === destination) {
      setErrorMsg('Source and destination cannot be the same.');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setErrorMsg('Please enter a valid amount.');
      return;
    }
    if (isExternal && (!extAccount || !extRouting)) {
      setErrorMsg('Please provide external account number and routing.');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        source,
        destination,
        amount: Number(amount),
      };
      if (isExternal) {
        payload.extAccount = extAccount;
        payload.extRouting = extRouting;
      }

      const res = await fetch('/api/transactions/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data: ApiResponse = await res.json();
      setLoading(false);

      if (!data.success) {
        setErrorMsg(data.message || 'Transfer failed.');
        return;
      }

      setSuccessData(data);
      setAmount('');
      setExtAccount('');
      setExtRouting('');
    } catch (err) {
      console.error(err);
      setLoading(false);
      setErrorMsg('Network or server error. Please try again.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.navBack}>
        <button onClick={() => router.back()} className={styles.backButton}>
          ← Back
        </button>
      </div>

      <h1 className={styles.title}>Transfer Funds</h1>

      {errorMsg && <div className={styles.errorMsg}>{errorMsg}</div>}
      {successData && (
        <div className={styles.successBox}>
          <p>✅ Transfer Successful!</p>
          <p>
            Transaction ID: <strong>{successData.transactionId}</strong>
          </p>
          <p>A confirmation email has been sent to you and the recipient.</p>
        </div>
      )}

      <form onSubmit={handleTransfer} className={styles.form}>
        <div className={styles.fieldGroup}>
          <label htmlFor="source">From</label>
          <select
            id="source"
            value={source}
            onChange={(e) => setSource(e.target.value as any)}
          >
            <option value="checking">Checking Account</option>
            <option value="savings">Savings Account</option>
            <option value="bitcoin">Bitcoin Wallet</option>
          </select>
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="destination">To</label>
          <select
            id="destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value as any)}
          >
            <option value="checking">Checking Account</option>
            <option value="savings">Savings Account</option>
            <option value="bitcoin">Bitcoin Wallet</option>
            <option value="external">External Account</option>
          </select>
        </div>

        {isExternal && (
          <>
            <div className={styles.formField}>
              <label htmlFor="extAccount">Recipient Account Number</label>
              <input
                id="extAccount"
                type="text"
                value={extAccount}
                onChange={(e) => setExtAccount(e.target.value)}
                placeholder="1234567890"
                required
              />
            </div>
            <div className={styles.formField}>
              <label htmlFor="extRouting">Recipient Routing Number</label>
              <input
                id="extRouting"
                type="text"
                value={extRouting}
                onChange={(e) => setExtRouting(e.target.value)}
                placeholder="021000021"
                required
              />
            </div>
          </>
        )}

        <div className={styles.formField}>
          <label htmlFor="amount">Amount</label>
          <input
            id="amount"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 50.00"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={styles.submitBtn}
        >
          {loading ? 'Processing…' : 'Transfer'}
        </button>
      </form>
    </div>
  );
}
