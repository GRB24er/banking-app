// File: src/app/dashboard/page.tsx

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]/route';
import Link from 'next/link';
import Image from 'next/image';
import styles from './dashboard.module.css';
import dbConnect from '../../lib/mongodb';
import User from '../../models/User';
import Transaction, { ITransaction } from '../../models/Transaction';

type TransactionType = {
  _id: string;
  type: 'deposit' | 'send' | 'transfer_usd' | 'transfer_btc';
  currency: 'USD' | 'BTC';
  amount: number;
  date: string;
  description?: string;
};

export default async function DashboardPage() {
  // 1) Get the current session (server-side)
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return (
      <html>
        <body>
          <script>{`window.location.href = '/auth/signin';`}</script>
        </body>
      </html>
    );
  }

  // 2) Extract user fields from session, with defaults
  const {
    name,
    email,
    role,
    balance = 0,
    btcBalance = 0,
    accountNumber = '',
    routingNumber = '',
    bitcoinAddress = '',
  } = session.user as {
    name: string;
    email: string;
    role: 'user' | 'admin';
    balance?: number;
    btcBalance?: number;
    accountNumber?: string;
    routingNumber?: string;
    bitcoinAddress?: string;
  };

  // 3) Connect to DB and fetch recent transactions
  await dbConnect();
  const userDoc = await User.findOne({ email }).lean();
  if (!userDoc) {
    return (
      <html>
        <body>
          <script>{`window.location.href = '/auth/signin';`}</script>
        </body>
      </html>
    );
  }

  // Cast the result of .lean() to ITransaction[] so txnDocs.map(...) works
  const txnDocs = (await Transaction.find({ userId: userDoc._id })
    .sort({ date: -1 })
    .limit(10)
    .lean()) as ITransaction[];

  const recentTransactions: TransactionType[] = txnDocs.map((txn: ITransaction) => ({
    _id: txn._id.toString(),
    type: txn.type,
    currency: txn.currency,
    amount: txn.amount,
    date: txn.date.toISOString().split('T')[0],
    description: txn.description,
  }));

  return (
    <div className={styles.dashboardContainer}>
      {/* ──────────────────────────────────────────────────────────── */}
      {/* 1) Header */}
      <div className={styles.header}>
        {/* Logo */}
        <div className="logo">
          <Image src="/icons/logo.svg" alt="Logo" width={32} height={32} />
          <span className="brandName">Horizon Global Capital</span>
        </div>

        {/* Navigation Links */}
        <div className={styles.navLinks}>
          <Link href="/dashboard" style={{ marginRight: '24px' }}>
            Dashboard
          </Link>
          <Link href="/send-money" style={{ marginRight: '24px' }}>
            Send Money
          </Link>
          <Link href="/deposit" style={{ marginRight: '24px' }}>
            Deposit
          </Link>
          <Link href="/transfer" style={{ marginRight: '24px' }}>
            Transfer
          </Link>
          <Link href="/settings" style={{ marginRight: '24px' }}>
            Settings
          </Link>
          <Link href="/profile">
            <div className={styles.profileIcon}>
              {name.charAt(0).toUpperCase()}
            </div>
          </Link>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 2) Main Content */}
      <div className={styles.mainContent}>
        {/* 2a) Balance & Actions Row */}
        <div className={styles.balanceRow}>
          {/* USD Balance Card */}
          <div className={styles.balanceCard}>
            <div className="label">Total Balance (USD)</div>
            <p className="amount">${balance.toFixed(2)}</p>
          </div>

          {/* BTC Balance Card */}
          <div className={styles.balanceCard} style={{ marginLeft: '16px' }}>
            <div className="label">Bitcoin Balance</div>
            <p className="amount">{btcBalance.toFixed(6)} BTC</p>
          </div>

          {/* Action Buttons */}
          <div className={styles.actions}>
            <button className={styles.actionButton}>Send Money</button>
            <button className={styles.actionButton}>Deposit</button>
            <button className={styles.actionButton}>Transfer</button>
          </div>
        </div>

        {/* 2b) Bank Account & Crypto Wallet Cards */}
        <div className={styles.secondaryRow}>
          {/* Bank Account Card */}
          <div className={styles.accountCard}>
            <div className="cardHeader">
              <h3>Checking Account</h3>
              <div className="accountNumber">
                {/* Mask all but last 4 digits */}
                {accountNumber.replace(/.(?=.{4})/g, '•')}
              </div>
            </div>
            <div className="accountBalance">${balance.toFixed(2)}</div>
            <div className="accountNote">Routing: {routingNumber}</div>
          </div>

          {/* Crypto Wallet Card */}
          <div className={styles.cryptoCard}>
            <div className="cardHeader">
              <h3>Bitcoin Wallet</h3>
            </div>
            <div className="cryptoBalance">{btcBalance.toFixed(6)} BTC</div>
            <div className="accountNote">
              {bitcoinAddress.slice(0, 4)}…{bitcoinAddress.slice(-4)}
            </div>
          </div>
        </div>

        {/* 2c) Recent Transactions Section */}
        <div className={styles.transactionsSection}>
          <h2>Recent Transactions</h2>
          {recentTransactions.length === 0 ? (
            <p style={{ padding: '0 24px', color: '#777' }}>
              You have no transactions yet.
            </p>
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
                {recentTransactions.map((txn: TransactionType) => (
                  <tr key={txn._id}>
                    <td style={{ color: '#555' }}>{txn.date}</td>
                    <td>{txn.description}</td>
                    <td>{txn.type.replace('_', ' ')}</td>
                    <td>
                      {txn.amount >= 0 ? (
                        <span className="txnPositive">
                          {txn.currency === 'USD' ? '$' : ''}
                          {txn.amount.toFixed(2)}
                          {txn.currency === 'BTC' ? ' BTC' : ''}
                        </span>
                      ) : (
                        <span className="txnNegative">
                          –{txn.currency === 'USD' ? '$' : ''}
                          {Math.abs(txn.amount).toFixed(2)}
                          {txn.currency === 'BTC' ? ' BTC' : ''}
                        </span>
                      )}
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
