'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './adjustBalance.module.css';
import { OWNER_EMAIL } from '@/lib/constants';

interface ApiResponse {
  success: boolean;
  newBalance: number;
  message?: string;
}

export default function AdjustBalancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      // Case-insensitive comparison
      const normalizedOwner = OWNER_EMAIL.trim().toLowerCase();
      const normalizedUser = (session.user?.email || '').trim().toLowerCase();
      
      if (normalizedUser === normalizedOwner) {
        setIsAuthorized(true);
      } else {
        router.push('/dashboard');
      }
      setLoadingAuth(false);
    }
  }, [session, status, router]);

  const [userEmail, setUserEmail] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'BTC'>('USD');
  const [action, setAction] = useState<'credit' | 'debit'>('credit');
  const [amount, setAmount] = useState('');

  // Feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [newBalance, setNewBalance] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setNewBalance(null);

    if (!userEmail) {
      setErrorMsg('Please enter the user’s email.');
      return;
    }
    
    const numAmount = Number(amount);
    if (!amount || numAmount <= 0) {
      setErrorMsg('Please enter a valid positive amount.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/adjust-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail,
          currency,
          action,
          amount: numAmount,
        }),
      });
      
      const data: ApiResponse = await res.json();
      setLoading(false);

      if (!data.success) {
        setErrorMsg(data.message || 'Adjustment failed.');
        return;
      }

      setNewBalance(data.newBalance);
      setUserEmail('');
      setAmount('');
    } catch (err) {
      console.error(err);
      setLoading(false);
      setErrorMsg('Network or server error. Please try again.');
    }
  };

  if (loadingAuth) {
    return (
      <div className={styles.container}>
        <p>Checking authorization...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className={styles.container}>
        <p>You don't have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Admin: Adjust User Balance</h1>

      {errorMsg && <div className={styles.errorMsg}>{errorMsg}</div>}
      {newBalance !== null && (
        <div className={styles.successBox}>
          <p>
            ✅ New {currency === 'USD' ? 'USD' : 'BTC'} Balance:{' '}
            <strong>
              {currency === 'USD'
                ? `$${newBalance.toFixed(2)}`
                : `${newBalance.toFixed(6)} BTC`}
            </strong>
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* User Email */}
        <div className={styles.formField}>
          <label htmlFor="userEmail">User Email</label>
          <input
            id="userEmail"
            type="email"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            placeholder="user@example.com"
            required
          />
        </div>

        {/* Currency */}
        <div className={styles.formField}>
          <label htmlFor="currency">Currency</label>
          <select
            id="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as 'USD' | 'BTC')}
          >
            <option value="USD">USD</option>
            <option value="BTC">BTC</option>
          </select>
        </div>

        {/* Action */}
        <div className={styles.formField}>
          <label htmlFor="action">Action</label>
          <select
            id="action"
            value={action}
            onChange={(e) => setAction(e.target.value as 'credit' | 'debit')}
          >
            <option value="credit">Credit</option>
            <option value="debit">Debit</option>
          </select>
        </div>

        {/* Amount */}
        <div className={styles.formField}>
          <label htmlFor="amount">Amount</label>
          <input
            id="amount"
            type="number"
            step={currency === 'USD' ? '0.01' : '0.000001'}
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={currency === 'USD' ? 'e.g. 100.00' : 'e.g. 0.010000'}
            required
          />
        </div>

        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? 'Submitting…' : 'Submit Adjustment'}
        </button>
      </form>
    </div>
  );
}