'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './sendMoney.module.css';

interface ApiResponse {
  success: boolean;
  transactionId: string;
  message?: string;
}

export default function SendMoneyPage() {
  const router = useRouter();

  const [sendBy, setSendBy] = useState<'email' | 'account'>('email');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientAccount, setRecipientAccount] = useState('');
  const [recipientRouting, setRecipientRouting] = useState('');
  const [amount, setAmount] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<ApiResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessData(null);

    // Basic validation
    if (sendBy === 'email' && !recipientEmail) {
      setErrorMsg('Please enter recipient’s email.');
      return;
    }
    if (sendBy === 'account') {
      if (!recipientAccount || !recipientRouting) {
        setErrorMsg('Please enter recipient’s account number and routing number.');
        return;
      }
    }
    if (!amount || Number(amount) <= 0) {
      setErrorMsg('Please enter a valid positive amount.');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        amount: Number(amount),
        method: sendBy,
        ...(sendBy === 'email'
          ? { recipientEmail }
          : { recipientAccount, recipientRouting }),
      };

      const res = await fetch('/api/transactions/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data: ApiResponse = await res.json();
      setLoading(false);

      if (!data.success) {
        setErrorMsg(data.message || 'Transaction failed.');
        return;
      }

      setSuccessData(data);
      // Clear form
      setRecipientEmail('');
      setRecipientAccount('');
      setRecipientRouting('');
      setAmount('');
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

      <h1 className={styles.title}>Send Money</h1>

      {errorMsg && <div className={styles.errorMsg}>{errorMsg}</div>}
      {successData && (
        <div className={styles.successBox}>
          <p>✅ Transfer Successful!</p>
          <p>
            Transaction ID: <strong>{successData.transactionId}</strong>
          </p>
          <p>A confirmation email has been sent.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.fieldGroup}>
          <label>Send By:</label>
          <div className={styles.radioGroup}>
            <label>
              <input
                type="radio"
                name="sendBy"
                value="email"
                checked={sendBy === 'email'}
                onChange={() => {
                  setSendBy('email');
                  setRecipientAccount('');
                  setRecipientRouting('');
                }}
              />
              Email
            </label>
            <label>
              <input
                type="radio"
                name="sendBy"
                value="account"
                checked={sendBy === 'account'}
                onChange={() => {
                  setSendBy('account');
                  setRecipientEmail('');
                }}
              />
              Account Number
            </label>
          </div>
        </div>

        {sendBy === 'email' && (
          <div className={styles.formField}>
            <label htmlFor="recipientEmail">Recipient Email</label>
            <input
              id="recipientEmail"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="friend@example.com"
              required
            />
          </div>
        )}

        {sendBy === 'account' && (
          <>
            <div className={styles.formField}>
              <label htmlFor="recipientAccount">Account Number</label>
              <input
                id="recipientAccount"
                type="text"
                value={recipientAccount}
                onChange={(e) => setRecipientAccount(e.target.value)}
                placeholder="1234567890"
                required
              />
            </div>
            <div className={styles.formField}>
              <label htmlFor="recipientRouting">Routing Number</label>
              <input
                id="recipientRouting"
                type="text"
                value={recipientRouting}
                onChange={(e) => setRecipientRouting(e.target.value)}
                placeholder="021000021"
                required
              />
            </div>
          </>
        )}

        <div className={styles.formField}>
          <label htmlFor="amount">Amount (USD)</label>
          <input
            id="amount"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 100.00"
            required
          />
        </div>

        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? 'Processing…' : 'Send Money'}
        </button>
      </form>
    </div>
  );
}
