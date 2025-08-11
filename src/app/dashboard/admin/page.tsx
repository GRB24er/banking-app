'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './admin.module.css';
import Link from 'next/link';

type Money = { USD: number; BTC: number };
type Accounts = {
  checking: Money;
  savings: Money;
  investment: Money;
};

type UserRow = {
  _id: string;
  name: string;
  email: string;
  verified: boolean;
  accounts: Accounts;
};

type Overview = {
  page: number;
  pageSize: number;
  totalUsers: number;
  stats: { totalUsers: number; pendingTransactions: number };
  users: UserRow[];
  recentTransactions: any[];
};

type AccountType = 'checking' | 'savings' | 'investment';

export default function AdminDashboard() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [query, setQuery] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [modalKind, setModalKind] = useState<'deposit' | 'withdraw'>('deposit');
  const [modalUser, setModalUser] = useState<UserRow | null>(null);
  const [accountType, setAccountType] = useState<AccountType>('checking');
  const [currency, setCurrency] = useState<'USD' | 'BTC'>('USD');
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  async function fetchOverview() {
    setLoading(true);
    setErr(null);
    try {
      const url = new URL('/api/admin/overview', window.location.origin);
      url.searchParams.set('page', String(page));
      url.searchParams.set('pageSize', String(pageSize));
      if (query.trim()) url.searchParams.set('query', query.trim());
      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Failed: ${res.status}`);
      }
      const json = (await res.json()) as Overview;
      setData(json);
    } catch (e: any) {
      setErr(e.message || 'Failed to load overview');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil((data.totalUsers || 0) / data.pageSize));
  }, [data]);

  function openAction(u: UserRow, kind: 'deposit' | 'withdraw') {
    setModalUser(u);
    setModalKind(kind);
    setAccountType('checking');
    setCurrency('USD');
    setAmount('');
    setNote('');
    setModalOpen(true);
  }

  async function doSubmit() {
    if (!modalUser) return;
    setSubmitting(true);
    try {
      const endpoint =
        modalKind === 'deposit'
          ? `/api/admin/user/${modalUser._id}/deposit`
          : `/api/admin/user/${modalUser._id}/withdraw`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(amount),
          currency,
          accountType,
          description: note,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Failed to ${modalKind}`);
      }

      setModalOpen(false);
      await fetchOverview();
    } catch (e: any) {
      alert(e.message || 'Request failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleVerify(u: UserRow) {
    try {
      const res = await fetch(`/api/admin/user/${u._id}/verify`, { method: 'PATCH' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Failed to toggle verify');
      }
      await fetchOverview();
    } catch (e: any) {
      alert(e.message || 'Could not verify');
    }
  }

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchOverview();
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Admin Dashboard</h1>
          <p className={styles.sub}>Manage users, accounts, and pending transactions.</p>
        </div>
        <div className={styles.headerActions}>
          <Link className={styles.link} href="/dashboard/admin/transactions">Pending Review</Link>
        </div>
      </header>

      <section className={styles.cards}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Total Users</div>
          <div className={styles.metric}>{data?.stats?.totalUsers ?? '—'}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Pending Transactions</div>
          <div className={styles.metric}>{data?.stats?.pendingTransactions ?? '—'}</div>
        </div>
      </section>

      <section className={styles.bar}>
        <form className={styles.searchForm} onSubmit={onSearch}>
          <input
            className={styles.input}
            placeholder="Search users by name or email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className={styles.btn} type="submit">Search</button>
        </form>
      </section>

      {loading ? (
        <div className={styles.loading}>Loading…</div>
      ) : err ? (
        <div className={styles.error}>{err}</div>
      ) : (
        <section className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User</th>
                <th>Checking</th>
                <th>Savings</th>
                <th>Investment</th>
                <th className={styles.right}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.users?.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div className={styles.userName}>
                      {u.name} {u.verified ? <span className={styles.badgeOk}>Verified</span> : <span className={styles.badgeMuted}>Unverified</span>}
                    </div>
                    <div className={styles.subtle}>{u.email}</div>
                  </td>
                  <td className={styles.mono}>
                    ${u.accounts.checking.USD.toFixed(2)}{' '}
                    <span className={styles.subtle}>| BTC {u.accounts.checking.BTC}</span>
                  </td>
                  <td className={styles.mono}>
                    ${u.accounts.savings.USD.toFixed(2)}{' '}
                    <span className={styles.subtle}>| BTC {u.accounts.savings.BTC}</span>
                  </td>
                  <td className={styles.mono}>
                    ${u.accounts.investment.USD.toFixed(2)}{' '}
                    <span className={styles.subtle}>| BTC {u.accounts.investment.BTC}</span>
                  </td>
                  <td className={styles.right}>
                    <div className={styles.actions}>
                      <button className={`${styles.btn} ${styles.good}`} onClick={() => openAction(u, 'deposit')}>Deposit</button>
                      <button className={`${styles.btn} ${styles.warn}`} onClick={() => openAction(u, 'withdraw')}>Withdraw</button>
                      <button className={styles.btn} onClick={() => toggleVerify(u)}>{u.verified ? 'Unverify' : 'Verify'}</button>
                      <Link className={styles.btn} href={`/dashboard/admin/transactions?query=${encodeURIComponent(u._id)}`}>Statement</Link>
                    </div>
                  </td>
                </tr>
              ))}
              {!data?.users?.length && (
                <tr><td colSpan={5} className={styles.empty}>No users</td></tr>
              )}
            </tbody>
          </table>

          <div className={styles.pagination}>
            <button className={styles.btn} disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
            <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
            <button className={styles.btn} disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
          </div>
        </section>
      )}

      {modalOpen && modalUser && (
        <div className={styles.modalBackdrop} onClick={() => setModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>
              {modalKind === 'deposit' ? 'Admin Deposit' : 'Admin Withdrawal'}
            </h3>
            <div className={styles.grid2}>
              <label className={styles.label}>
                Account Type
                <select value={accountType} onChange={(e) => setAccountType(e.target.value as AccountType)} className={styles.input}>
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="investment">Investment</option>
                </select>
              </label>

              <label className={styles.label}>
                Currency
                <select value={currency} onChange={(e) => setCurrency(e.target.value as 'USD' | 'BTC')} className={styles.input}>
                  <option value="USD">USD</option>
                  <option value="BTC">BTC</option>
                </select>
              </label>
            </div>

            <div className={styles.grid2}>
              <label className={styles.label}>
                Amount
                <input className={styles.input} type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </label>

              <label className={styles.label}>
                Note (optional)
                <input className={styles.input} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g., manual adjustment" />
              </label>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.btn} onClick={() => setModalOpen(false)}>Cancel</button>
              <button className={`${styles.btn} ${styles.primary}`} disabled={submitting || !amount} onClick={doSubmit}>
                {submitting ? 'Submitting…' : 'Confirm'}
              </button>
            </div>
            <p className={styles.caption}>
              This creates a <b>pending</b> transaction. It will impact balances only after you approve it in “Pending Review”.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
