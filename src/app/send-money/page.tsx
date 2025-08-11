'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import styles from './sendMoney.module.css';

type AccountType = 'checking' | 'savings' | 'investment';
type Mode = 'p2p' | 'internal';

type Receipt = {
  reference?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'pending_verification';
  amount: string;
  currency: string;
  fromAccountType: AccountType;
  toAccountType?: AccountType;
  toEmail?: string;
  description?: string;
  submittedAt: string; // ISO
};

function titleCase(s: string) {
  return (s || '').replace(/[-_]/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}
function fmtAmount(n: string | number, currency = 'USD') {
  const num = Number(String(n).replace(/,/g, ''));
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(isFinite(num) ? num : 0);
  } catch {
    return new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
      isFinite(num) ? num : 0
    );
  }
}

function StatusChip({ status }: { status: Receipt['status'] }) {
  const s = (status || 'pending').toLowerCase() as Receipt['status'];
  const label =
    s === 'approved' || s === 'completed'
      ? 'Completed'
      : s === 'pending_verification'
      ? 'Pending — Verification'
      : s === 'rejected'
      ? 'Rejected'
      : 'Pending';
  const cls =
    s === 'approved' || s === 'completed'
      ? styles.chipCompleted
      : s === 'rejected'
      ? styles.chipRejected
      : styles.chipPending;
  return <span className={`${styles.chip} ${cls}`}>{label}</span>;
}

export default function SendMoneyPage() {
  const [mode, setMode] = useState<Mode>('p2p');
  const [fromAccountType, setFromAccountType] = useState<AccountType>('checking');
  const [toAccountType, setToAccountType] = useState<AccountType>('checking');
  const [toEmail, setToEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const canSubmit = useMemo(() => {
    if (!amount.trim()) return false;
    if (mode === 'p2p' && !toEmail.trim()) return false;
    if (mode === 'internal' && fromAccountType === toAccountType) return false;
    return true;
  }, [mode, amount, toEmail, fromAccountType, toAccountType]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setError(null);
    setReceipt(null);

    const payload: any = {
      fromAccountType,
      amount, // server parses commas via parseAmount
      description: description || undefined,
    };
    if (mode === 'p2p') {
      payload.toEmail = toEmail.trim();
      payload.toAccountType = toAccountType; // optional; API defaults to checking
    } else {
      payload.toAccountType = toAccountType;
    }

    try {
      const res = await fetch('/api/transactions/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store',
      });

      // Safe parse with clone() in case of HTML error responses
      const clone = res.clone();
      let data: any = null;
      const ct = res.headers.get('content-type') || '';
      const probablyJson = ct.includes('application/json');

      try {
        data = probablyJson ? await res.json() : null;
      } catch {
        data = null;
      }
      if (!data) {
        const text = await clone.text();
        throw new Error(`Request failed (${res.status}): ${text.slice(0, 200)}`);
      }
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `Request failed (${res.status})`);
      }

      const nowIso = new Date().toISOString();
      const r: Receipt = {
        reference: data.reference,
        status: (data.status as Receipt['status']) || 'pending',
        amount,
        currency: 'USD',
        fromAccountType,
        toAccountType: mode === 'internal' ? toAccountType : payload.toAccountType,
        toEmail: mode === 'p2p' ? payload.toEmail : undefined,
        description: description || undefined,
        submittedAt: nowIso,
      };
      setReceipt(r);

      setAmount('');
      setDescription('');
      if (mode === 'p2p') setToEmail('');
    } catch (err: any) {
      setError(err?.message || 'Transfer failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setReceipt(null);
    setError(null);
  }

  return (
    <main className={styles.container}>
      {/* Top back bar */}
      <div className={styles.topbar}>
        <Link href="/dashboard" className={styles.backBtn} aria-label="Back to Dashboard">
          <span className={styles.backArrow} aria-hidden>←</span>
          <span className={styles.backText}>Back to Dashboard</span>
        </Link>
        <Link href="/" className={styles.homeLink}>Home</Link>
      </div>

      <h1 className={styles.h1}>Send Money</h1>
      {!receipt && (
        <p className={styles.lead}>
          Submit a transfer to another customer or move funds between your accounts. Transfers are reviewed before posting.
        </p>
      )}

      {/* Success Receipt */}
      {receipt && (
        <section className={styles.cardSuccess}>
          <div className={styles.cardHeader}>
            <div className={styles.iconCircle} aria-hidden>
              ✓
            </div>
            <div>
              <h2 className={styles.cardTitle}>Transfer submitted</h2>
              <div className={styles.subtle}>
                We’re processing your request. You’ll receive an email when the transfer is completed.
              </div>
            </div>
            <div className={styles.headerStatus}>
              <StatusChip status={receipt.status} />
            </div>
          </div>

          <div className={styles.detailsGrid}>
            {receipt.reference && (
              <>
                <div className={styles.dt}>Reference</div>
                <div className={styles.dd}>{receipt.reference}</div>
              </>
            )}

            <div className={styles.dt}>Amount</div>
            <div className={styles.dd}>{fmtAmount(receipt.amount, receipt.currency)}</div>

            <div className={styles.dt}>From</div>
            <div className={styles.dd}>{titleCase(receipt.fromAccountType)}</div>

            {receipt.toEmail ? (
              <>
                <div className={styles.dt}>To</div>
                <div className={styles.dd}>{receipt.toEmail}</div>
              </>
            ) : (
              <>
                <div className={styles.dt}>To</div>
                <div className={styles.dd}>{titleCase(receipt.toAccountType || 'checking')}</div>
              </>
            )}

            {receipt.description && (
              <>
                <div className={styles.dt}>Description</div>
                <div className={styles.dd}>{receipt.description}</div>
              </>
            )}

            <div className={styles.dt}>Submitted</div>
            <div className={styles.dd}>{new Date(receipt.submittedAt).toLocaleString()}</div>
          </div>

          <div className={styles.actionsRow}>
            <Link className={styles.btnGhost} href="/dashboard">View dashboard</Link>
            <button type="button" className={styles.btnPrimary} onClick={resetForm}>
              Make another transfer
            </button>
          </div>
        </section>
      )}

      {/* Form */}
      {!receipt && (
        <form onSubmit={handleSubmit} className={styles.formCard}>
          {/* Mode */}
          <div className={styles.row}>
            <div className={styles.segmented}>
              <label className={styles.segment}>
                <input
                  type="radio"
                  name="mode"
                  value="p2p"
                  checked={mode === 'p2p'}
                  onChange={() => setMode('p2p')}
                />
                <span>To another customer (email)</span>
              </label>
              <label className={styles.segment}>
                <input
                  type="radio"
                  name="mode"
                  value="internal"
                  checked={mode === 'internal'}
                  onChange={() => setMode('internal')}
                />
                <span>Between my accounts</span>
              </label>
            </div>
          </div>

          {/* From / To */}
          <div className={styles.rowGrid}>
            <div>
              <label className={styles.label}>From account</label>
              <select
                value={fromAccountType}
                onChange={(e) => setFromAccountType(e.target.value as AccountType)}
                className={styles.select}
              >
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
                <option value="investment">Investment</option>
              </select>
            </div>

            {mode === 'p2p' ? (
              <div>
                <label className={styles.label}>Recipient email</label>
                <input
                  type="email"
                  placeholder="recipient@example.com"
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>
            ) : (
              <div>
                <label className={styles.label}>To account</label>
                <select
                  value={toAccountType}
                  onChange={(e) => setToAccountType(e.target.value as AccountType)}
                  className={styles.select}
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="investment">Investment</option>
                </select>
              </div>
            )}
          </div>

          {/* Amount / Description */}
          <div className={styles.rowGrid}>
            <div>
              <label className={styles.label}>Amount (USD)</label>
              <input
                inputMode="decimal"
                placeholder="e.g. 45,909,900.98"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={styles.input}
                required
              />
            </div>
            <div>
              <label className={styles.label}>Description (optional)</label>
              <input
                placeholder={mode === 'p2p' ? 'Payment to recipient' : 'Internal transfer'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>

          {/* Errors */}
          {error && <div className={styles.alertError}>{error}</div>}

          {/* Submit */}
          <div className={styles.actionsRow}>
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className={styles.btnPrimary}
            >
              {submitting ? 'Submitting…' : 'Submit transfer'}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
