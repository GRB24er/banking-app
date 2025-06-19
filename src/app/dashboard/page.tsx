// File: src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import styles from './dashboard.module.css';

interface Transaction {
  _id: string;
  type: 'deposit' | 'send' | 'transfer_usd' | 'transfer_btc';
  currency: 'USD' | 'BTC';
  amount: number;
  date: string;
  description?: string;
}

interface UserData {
  name: string;
  email: string;
  role: 'user' | 'admin';
  balance: number;
  btcBalance: number;
  accountNumber: string;
  routingNumber: string;
  bitcoinAddress: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    if (status === 'authenticated') {
      fetchUserData();
    }
  }, [status]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/dashboard', {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      console.log('🔍 dashboard API returned:', data);

      if (data.error) {
        throw new Error(data.error);
      }

      setUserData(data.user);

      // FIX: use tx._id (from API) as key, not tx.reference
      setRecentTransactions(
        (data.recent as any[]).map((tx) => ({
          _id: tx._id,
          type: tx.type,
          currency: tx.currency,
          amount: tx.amount,
          date: typeof tx.date === 'string'
            ? tx.date
            : new Date(tx.date).toISOString(),
          description: tx.description,
        }))
      );
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      router.push('/auth/signin');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !userData) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  const {
    name,
    balance,
    btcBalance,
    accountNumber,
    routingNumber,
    bitcoinAddress,
  } = userData;

  return (
    <div className={styles.dashboardContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.logo}>
          <Image src="/icons/logo.svg" alt="Logo" width={32} height={32} />
          <span className={styles.brandName}>Horizon Global Capital</span>
        </div>
        <div className={styles.navLinks}>
          <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
          <Link href="/send-money" className={styles.navLink}>Send Money</Link>
          <Link href="/deposit" className={styles.navLink}>Deposit</Link>
          <Link href="/transfer" className={styles.navLink}>Transfer</Link>
          <Link href="/settings" className={styles.navLink}>Settings</Link>
          <Link href="/profile">
            <div className={styles.profileIcon}>{name.charAt(0).toUpperCase()}</div>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Balances & Actions */}
        <div className={styles.balanceRow}>
          <div className={styles.balanceCard}>
            <div className={styles.label}>Total Balance (USD)</div>
            <p className={styles.amount}>${balance.toFixed(2)}</p>
          </div>
          <div className={styles.balanceCard}>
            <div className={styles.label}>Bitcoin Balance</div>
            <p className={styles.amount}>{btcBalance.toFixed(6)} BTC</p>
          </div>
          <div className={styles.actions}>
            <button onClick={() => router.push('/send-money')} className={styles.actionButton}>Send Money</button>
            <button onClick={() => router.push('/deposit')} className={styles.actionButton}>Deposit</button>
            <button onClick={() => router.push('/transfer')} className={styles.actionButton}>Transfer</button>
          </div>
        </div>

        {/* Account Cards */}
        <div className={styles.secondaryRow}>
          <div className={styles.accountCard}>
            <div className={styles.cardHeader}>
              <h3>Checking Account</h3>
              <div className={styles.accountNumber}>
                {accountNumber.replace(/.(?=.{4})/g, '•')}
              </div>
            </div>
            <div className={styles.accountBalance}>${balance.toFixed(2)}</div>
            <div className={styles.accountNote}>Routing: {routingNumber}</div>
          </div>
          <div className={styles.cryptoCard}>
            <div className={styles.cardHeader}>
              <h3>Bitcoin Wallet</h3>
            </div>
            <div className={styles.cryptoBalance}>{btcBalance.toFixed(6)} BTC</div>
            <div className={styles.accountNote}>
              {bitcoinAddress.slice(0, 4)}…{bitcoinAddress.slice(-4)}
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className={styles.transactionsSection}>
          <h2>Recent Transactions</h2>
          {recentTransactions.length === 0 ? (
            <p className={styles.noTransactions}>You have no transactions yet.</p>
          ) : (
            <table className={styles.transactionsTable}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Currency</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((txn) => (
                  <tr key={txn._id}>
                    <td className={styles.dateCell}>{new Date(txn.date).toLocaleString()}</td>
                    <td>{txn.description || 'No description'}</td>
                    <td>{txn.type.replace(/_/g, ' ')}</td>
                    <td className={txn.amount >= 0 ? styles.positiveAmount : styles.negativeAmount}>
                      {txn.amount >= 0 ? '+' : '-'}
                      {txn.currency === 'USD' ? '$' : ''}
                      {Math.abs(txn.amount).toFixed(txn.currency === 'USD' ? 2 : 6)}
                      {txn.currency === 'BTC' ? ' BTC' : ''}
                    </td>
                    <td>{txn.currency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
