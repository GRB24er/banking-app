'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './settings.module.css';

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [bitcoinAddress, setBitcoinAddress] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // 1) On mount, populate form fields with current session data
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setName(session.user.name || '');
      setEmail(session.user.email || '');

      // These should also come from the session or a separate API call to /api/user/profile
      // For now, assume session.user contains them:
      setAccountNumber((session.user as any).accountNumber || '');
      setRoutingNumber((session.user as any).routingNumber || '');
      setBitcoinAddress((session.user as any).bitcoinAddress || '');
    }
  }, [status, session]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    // Basic validation
    if (!name || !email) {
      setErrorMsg('Name and email cannot be empty.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/user/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: password || undefined }),
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setErrorMsg(data.message || 'Update failed.');
        return;
      }

      setSuccessMsg('Profile updated successfully!');
      setPassword('');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setErrorMsg('Network or server error. Please try again.');
      setLoading(false);
    }
  };

  if (status !== 'authenticated') {
    return <p>Loading…</p>;
  }

  return (
    <div className={styles.container}>
      {/* ← Back button */}
      <button onClick={() => router.back()} className={styles.backBtn}>
        ← Back
      </button>

      <h1>Settings</h1>

      {errorMsg && <div className={styles.errorMsg}>{errorMsg}</div>}
      {successMsg && (
        <div style={{ color: 'green', marginBottom: '1rem' }}>
          {successMsg}
        </div>
      )}

      <form onSubmit={handleUpdate}>
        <div className={styles.formField}>
          <label htmlFor="name">Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className={styles.formField}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className={styles.formField}>
          <label htmlFor="password">New Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave blank to keep current password"
          />
        </div>

        <div className={styles.formField}>
          <label>Account Number</label>
          <input
            type="text"
            value={accountNumber}
            readOnly
            className={styles.readOnlyField}
          />
        </div>

        <div className={styles.formField}>
          <label>Routing Number</label>
          <input
            type="text"
            value={routingNumber}
            readOnly
            className={styles.readOnlyField}
          />
        </div>

        <div className={styles.formField}>
          <label>Bitcoin Address</label>
          <input
            type="text"
            value={bitcoinAddress}
            readOnly
            className={styles.readOnlyField}
          />
        </div>

        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? 'Updating…' : 'Update Settings'}
        </button>
      </form>
    </div>
  );
}
