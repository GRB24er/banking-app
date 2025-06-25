'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import styles from './dashboard.module.css';

import { StatsCard } from '@/components/StatsCard';
import { DebitCard } from '@/components/DebitCard';
import { RevealCard } from '@/components/RevealCard';
import { TransactionTable, Transaction } from '@/components/TransactionTable';

interface APITransaction {
  _id: string;
  type: 'deposit' | 'send' | 'transfer_usd' | 'transfer_btc';
  currency: 'USD' | 'BTC';
  amount: number;
  date: string;
  description?: string;
}

interface UserData {
  name: string;
  balance: number;
  btcBalance: number;
  accountNumber: string;
  routingNumber: string;
  bitcoinAddress: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { status } = useSession();
  const router = useRouter();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [recentTxs, setRecentTxs] = useState<APITransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // live BTC→USD rate
  const [btcRate, setBtcRate] = useState(0);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchData();
      fetchRate();
      const iv = setInterval(fetchRate, 60_000);
      return () => clearInterval(iv);
    }
  }, [status]);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch('/api/user/dashboard', { credentials: 'include' });
      const { user, recent } = await res.json();
      setUserData(user);
      setRecentTxs(recent);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRate() {
    try {
      const res = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
      );
      const data = await res.json();
      setBtcRate(data.bitcoin.usd);
    } catch {}
  }

  if (loading || !userData) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading your dashboard…</p>
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
    createdAt,
  } = userData;

  // DebitCard props
  const last4 = accountNumber.slice(-4);
  const cardNumber = `•••• •••• •••• ${last4}`;
  const reg = new Date(createdAt);
  reg.setFullYear(reg.getFullYear() + 5);
  const month = String(reg.getMonth() + 1).padStart(2, '0');
  const year = String(reg.getFullYear()).slice(-2);
  const expiry = `${month}/${year}`;

  // Map APITransaction → TransactionTable row
  const txns: Transaction[] = recentTxs.map((tx) => ({
    id: tx._id,
    description:
      tx.type === 'send'
        ? `Sent $${Math.abs(tx.amount).toFixed(2)} to ${tx.description}`
        : tx.description ?? '—',
    amount: tx.amount,
    currency: tx.currency,
    status:
      tx.type === 'send' || tx.type === 'deposit' ? 'Completed' : 'Pending',
    date: tx.date,
    category:
      tx.type === 'send'
        ? 'Transfer'
        : tx.type === 'deposit'
        ? 'Deposit'
        : tx.type === 'transfer_btc'
        ? 'Crypto'
        : 'Other',
  }));

  const fiatValue = btcBalance * btcRate;

  return (
    <div className={styles.dashboardContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.logo}>
          <Image src="/icons/logo.svg" alt="Logo" width={32} height={32} />
          <span className={styles.brandName}>Horizon Global Capital</span>
        </div>
        <nav className={styles.navLinks}>
          <Link href="/dashboard" className={styles.navLink}>
            Dashboard
          </Link>
          <Link href="/send-money" className={styles.navLink}>
            Send Money
          </Link>
          <Link href="/settings" className={styles.navLink}>
            Settings
          </Link>
        </nav>
      </div>

      {/* Main */}
      <div className={styles.mainContent}>
        {/* Stats & Card */}
        <div className={styles.statsDebitRow}>
          <StatsCard accountsCount={2} totalBalance={balance} />
          <DebitCard
            accountName={name}
            holderName={name}
            cardNumber={cardNumber}
            expiry={expiry}
          />
        </div>

        {/* Balances & Actions */}
        <div className={styles.balanceRow}>
          <div className={styles.balanceCard}>
            <div className={styles.label}>USD Balance</div>
            <p className={styles.amount}>
              ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className={styles.balanceCard}>
            <div className={styles.label}>BTC Balance</div>
            <p className={styles.amount}>
              ₿{' '}
              {new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 8,
              }).format(btcBalance)}
            </p>
            <p className={styles.fiatApprox}>
              ≈{' '}
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(fiatValue)}{' '}
              USD
            </p>
          </div>
          <div className={styles.actions}>
            <button className={styles.actionButton}>Deposit USD</button>
            <button className={styles.actionButton}>Buy/Sell BTC</button>
          </div>
        </div>

        {/* Revealable Details */}
        <div className={styles.detailCardsRow}>
          <RevealCard label="Account Number" value={accountNumber} />
          <RevealCard label="Routing Number" value={routingNumber} />
          <RevealCard
            label="Bitcoin Address"
            value={bitcoinAddress}
          />
        </div>

        {/* Recent Transactions */}
        <section className={styles.transactionsSection}>
          <h2 className={styles.sectionTitle}>Recent transactions</h2>
          <TransactionTable transactions={txns} />
        </section>
      </div>
    </div>
  )
}
