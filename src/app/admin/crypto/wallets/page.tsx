// src/app/admin/crypto/wallets/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface CryptoBalance {
  symbol: string;
  currency: string;
  balance: number;
  lockedBalance: number;
  available: number;
  usdValue: number;
  price: number;
}

interface UserWallet {
  walletId: string;
  userId: string;
  userName: string;
  userEmail: string;
  balances: CryptoBalance[];
  totalUsdValue: number;
}

export default function AdminCryptoWalletsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [wallets, setWallets] = useState<UserWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<'deposit' | 'withdraw'>('withdraw');
  const [selectedWallet, setSelectedWallet] = useState<UserWallet | null>(null);
  const [selectedCrypto, setSelectedCrypto] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    if (status === "authenticated") {
      if (
        session?.user?.email !== "admin@horizonbank.com" &&
        session?.user?.email !== "admin@example.com" &&
        (session?.user as any)?.role !== "admin"
      ) {
        router.push("/dashboard");
        return;
      }
      fetchWallets();
    }
  }, [status, session, router]);

  const fetchWallets = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/crypto/wallets");
      const data = await res.json();
      if (data.success) {
        setWallets(data.wallets);
      }
    } catch (err) {
      console.error("Error fetching wallets:", err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (wallet: UserWallet, action: 'deposit' | 'withdraw', symbol?: string) => {
    setSelectedWallet(wallet);
    setModalAction(action);
    setSelectedCrypto(symbol || wallet.balances[0]?.symbol || 'BTC');
    setAmount('');
    setDescription('');
    setShowModal(true);
  };

  const handleAction = async () => {
    if (!selectedWallet || !amount || !selectedCrypto) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setMessage("Please enter a valid amount");
      return;
    }

    setProcessing(true);
    try {
      const endpoint = modalAction === 'withdraw'
        ? '/api/admin/crypto/withdraw'
        : '/api/admin/crypto/deposit';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedWallet.userId,
          cryptoCurrency: selectedCrypto,
          amount: numAmount,
          description: description.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage(`✅ ${data.message}`);
        setShowModal(false);
        fetchWallets();
        setTimeout(() => setMessage(""), 5000);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (err) {
      setMessage("❌ Action failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const formatCrypto = (amount: number, symbol: string) => {
    if (amount === 0) return `0 ${symbol}`;
    if (amount < 0.00001) return `${amount.toExponential(4)} ${symbol}`;
    if (amount < 1) return `${amount.toFixed(8)} ${symbol}`;
    return `${amount.toFixed(6)} ${symbol}`;
  };

  const getCryptoIcon = (symbol: string) => {
    const icons: Record<string, string> = {
      BTC: "₿", ETH: "Ξ", USDT: "₮", USDC: "$", BNB: "B", XRP: "X", SOL: "◎", ADA: "₳"
    };
    return icons[symbol] || "●";
  };

  const s = {
    wrapper: { display: 'flex', minHeight: '100vh', background: '#0a0a0a' } as React.CSSProperties,
    mainContent: { flex: 1, marginLeft: 280, display: 'flex', flexDirection: 'column' as const, minHeight: '100vh' },
    main: { flex: 1, padding: 24, maxWidth: 1200, margin: '0 auto', width: '100%' },
    pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' as const, gap: 16 },
    title: { fontSize: 24, fontWeight: 700, color: '#fff', margin: 0 },
    subtitle: { color: '#888', fontSize: 14, marginTop: 4 },
    refreshBtn: { padding: '8px 16px', background: '#1a1f2e', color: '#c9a962', border: '1px solid #c9a96233', borderRadius: 8, cursor: 'pointer', fontSize: 13 },
    msg: { padding: '12px 16px', background: '#1a2a1a', border: '1px solid #2d4a2d', borderRadius: 8, color: '#4ade80', marginBottom: 16, fontSize: 14 },
    msgErr: { padding: '12px 16px', background: '#2a1a1a', border: '1px solid #4a2d2d', borderRadius: 8, color: '#f87171', marginBottom: 16, fontSize: 14 },
    loading: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#888' },
    empty: { textAlign: 'center' as const, padding: '60px 20px', color: '#888' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 20 },
    card: { background: '#111318', border: '1px solid #1e2230', borderRadius: 12, padding: 20, transition: 'border-color 0.2s' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    userName: { fontSize: 16, fontWeight: 600, color: '#fff', margin: 0 },
    userEmail: { fontSize: 13, color: '#888', marginTop: 2 },
    totalValue: { fontSize: 18, fontWeight: 700, color: '#c9a962' },
    balanceList: { display: 'flex', flexDirection: 'column' as const, gap: 10, marginBottom: 16 },
    balanceRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#0a0c10', borderRadius: 8 },
    cryptoInfo: { display: 'flex', alignItems: 'center', gap: 10 },
    icon: { width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#fff' },
    cryptoSymbol: { fontWeight: 600, color: '#fff', fontSize: 14 },
    cryptoAmount: { color: '#999', fontSize: 13 },
    cryptoUsd: { color: '#c9a962', fontWeight: 600, fontSize: 14, textAlign: 'right' as const },
    actions: { display: 'flex', gap: 8 },
    actionBtn: { flex: 1, padding: '10px 0', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 },
    depositBtn: { background: '#10b98120', color: '#10b981', border: '1px solid #10b98133' },
    withdrawBtn: { background: '#ef444420', color: '#ef4444', border: '1px solid #ef444433' },
    // Modal
    overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 },
    modal: { background: '#111318', border: '1px solid #1e2230', borderRadius: 16, padding: 28, maxWidth: 440, width: '100%' },
    modalTitle: { fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 20 },
    field: { marginBottom: 16 },
    label: { display: 'block', color: '#888', fontSize: 13, marginBottom: 6, fontWeight: 500 },
    input: { width: '100%', padding: '10px 12px', background: '#0a0c10', border: '1px solid #1e2230', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const },
    select: { width: '100%', padding: '10px 12px', background: '#0a0c10', border: '1px solid #1e2230', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const },
    modalActions: { display: 'flex', gap: 12, marginTop: 20 },
    cancelBtn: { flex: 1, padding: '12px 0', background: '#1a1f2e', color: '#888', border: '1px solid #1e2230', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 },
    confirmBtn: { flex: 1, padding: '12px 0', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 },
    confirmDeposit: { background: '#10b981', color: '#fff' },
    confirmWithdraw: { background: '#ef4444', color: '#fff' },
    userSummary: { background: '#0a0c10', borderRadius: 8, padding: 12, marginBottom: 16 },
    summaryRow: { display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 },
    summaryLabel: { color: '#888' },
    summaryValue: { color: '#fff', fontWeight: 500 },
  };

  if (status === "loading" || loading) {
    return (
      <div style={s.wrapper}>
        <Sidebar />
        <div style={s.mainContent}>
          <Header />
          <main style={s.main}>
            <div style={s.loading}>
              <p>Loading crypto wallets...</p>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div style={s.wrapper}>
      <Sidebar />
      <div style={s.mainContent}>
        <Header />
        <main style={s.main}>
          <div style={s.pageHeader}>
            <div>
              <h1 style={s.title}>Crypto Wallet Management</h1>
              <p style={s.subtitle}>View, deposit, and withdraw cryptocurrency from client accounts</p>
            </div>
            <button style={s.refreshBtn} onClick={fetchWallets}>🔄 Refresh</button>
          </div>

          {message && (
            <div style={message.startsWith('✅') ? s.msg : s.msgErr}>{message}</div>
          )}

          {wallets.length === 0 ? (
            <div style={s.empty}>
              <h2 style={{ color: '#fff', marginBottom: 8 }}>No Active Crypto Wallets</h2>
              <p>No users have crypto balances yet.</p>
            </div>
          ) : (
            <div style={s.grid}>
              {wallets.map((wallet) => (
                <div key={wallet.walletId} style={s.card}>
                  <div style={s.cardHeader}>
                    <div>
                      <h3 style={s.userName}>{wallet.userName}</h3>
                      <p style={s.userEmail}>{wallet.userEmail}</p>
                    </div>
                    <div style={s.totalValue}>{formatCurrency(wallet.totalUsdValue)}</div>
                  </div>

                  <div style={s.balanceList}>
                    {wallet.balances.map((b) => (
                      <div key={b.symbol} style={s.balanceRow}>
                        <div style={s.cryptoInfo}>
                          <div style={{ ...s.icon, background: '#c9a962' }}>
                            {getCryptoIcon(b.symbol)}
                          </div>
                          <div>
                            <div style={s.cryptoSymbol}>{b.symbol}</div>
                            <div style={s.cryptoAmount}>{formatCrypto(b.balance, '')}</div>
                          </div>
                        </div>
                        <div style={s.cryptoUsd}>{formatCurrency(b.usdValue)}</div>
                      </div>
                    ))}
                  </div>

                  <div style={s.actions}>
                    <button
                      style={{ ...s.actionBtn, ...s.depositBtn }}
                      onClick={() => openModal(wallet, 'deposit')}
                    >
                      + Deposit Crypto
                    </button>
                    <button
                      style={{ ...s.actionBtn, ...s.withdrawBtn }}
                      onClick={() => openModal(wallet, 'withdraw')}
                    >
                      − Withdraw Crypto
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
        <Footer />
      </div>

      {/* Modal */}
      {showModal && selectedWallet && (
        <div style={s.overlay} onClick={() => setShowModal(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={s.modalTitle}>
              {modalAction === 'deposit' ? 'Deposit Crypto' : 'Withdraw Crypto'}
            </h2>

            <div style={s.userSummary}>
              <div style={s.summaryRow}>
                <span style={s.summaryLabel}>Client</span>
                <span style={s.summaryValue}>{selectedWallet.userName}</span>
              </div>
              <div style={s.summaryRow}>
                <span style={s.summaryLabel}>Email</span>
                <span style={s.summaryValue}>{selectedWallet.userEmail}</span>
              </div>
            </div>

            <div style={s.field}>
              <label style={s.label}>Cryptocurrency</label>
              <select
                style={s.select}
                value={selectedCrypto}
                onChange={(e) => setSelectedCrypto(e.target.value)}
              >
                {modalAction === 'deposit' ? (
                  // For deposit, show all supported cryptos
                  ['BTC', 'ETH', 'USDT', 'USDC', 'BNB', 'XRP', 'SOL', 'ADA'].map(sym => (
                    <option key={sym} value={sym}>{sym}</option>
                  ))
                ) : (
                  // For withdraw, only show cryptos the user has
                  selectedWallet.balances.map(b => (
                    <option key={b.symbol} value={b.symbol}>
                      {b.symbol} — Available: {formatCrypto(b.available, '')}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div style={s.field}>
              <label style={s.label}>Amount</label>
              <input
                style={s.input}
                type="number"
                placeholder="0.00000000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.00000001"
              />
            </div>

            <div style={s.field}>
              <label style={s.label}>Description (Optional)</label>
              <input
                style={s.input}
                type="text"
                placeholder={modalAction === 'deposit' ? 'e.g. BTC deposit' : 'e.g. BTC withdrawal'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div style={s.modalActions}>
              <button style={s.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
              <button
                style={{
                  ...s.confirmBtn,
                  ...(modalAction === 'deposit' ? s.confirmDeposit : s.confirmWithdraw)
                }}
                onClick={handleAction}
                disabled={processing || !amount}
              >
                {processing ? 'Processing...' : modalAction === 'deposit' ? 'Confirm Deposit' : 'Confirm Withdrawal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
