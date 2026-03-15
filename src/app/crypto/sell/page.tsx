// src/app/crypto/sell/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "../crypto.module.css";
import convertStyles from "../convert/convert.module.css";

interface CryptoBalance {
  currency: string;
  symbol: string;
  balance: number;
  lockedBalance: number;
  availableBalance: number;
  usdValue: number;
  price: number;
}

function SellCryptoContent() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [balances, setBalances] = useState<CryptoBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selling, setSelling] = useState(false);

  // Form state
  const [fromCrypto, setFromCrypto] = useState(searchParams.get('crypto') || '');
  const [toAccount, setToAccount] = useState<'checking' | 'savings' | 'investment'>('checking');
  const [cryptoAmount, setCryptoAmount] = useState('');

  // Processing modal
  const [showProcessing, setShowProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [saleResult, setSaleResult] = useState<any>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    if (status === "authenticated") {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const walletRes = await fetch("/api/crypto/wallet");
      const walletData = await walletRes.json();
      if (walletData.success) {
        const withBalance = walletData.wallet.balances.filter((b: CryptoBalance) => b.balance > 0);
        setBalances(withBalance);
        if (!fromCrypto && withBalance.length > 0) {
          setFromCrypto(withBalance[0].symbol);
        }
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedBalance = () => balances.find(b => b.symbol === fromCrypto);

  const getUsdValue = () => {
    const selected = getSelectedBalance();
    const amt = parseFloat(cryptoAmount) || 0;
    return selected ? amt * selected.price : 0;
  };

  const getFee = () => getUsdValue() * 0.01;
  const getNetUsd = () => getUsdValue() - getFee();

  const handleSell = async () => {
    const amt = parseFloat(cryptoAmount);
    if (!amt || amt <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    const selected = getSelectedBalance();
    if (!selected || amt > selected.availableBalance) {
      alert(`Insufficient balance. Available: ${selected?.availableBalance.toFixed(8)} ${fromCrypto}`);
      return;
    }

    if (getNetUsd() < 1) {
      alert("Amount too small. Minimum sale must yield at least $1.00");
      return;
    }

    setShowProcessing(true);
    setProcessingStep(0);
    setSelling(true);

    const steps = [
      "Verifying crypto balance",
      "Fetching live market rates",
      "Processing sale",
      "Crediting your account",
      "Finalizing transaction"
    ];

    for (let i = 0; i < steps.length; i++) {
      setProcessingStep(i);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    try {
      const res = await fetch("/api/crypto/sell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromCrypto,
          toAccount,
          cryptoAmount: amt,
        })
      });

      const data = await res.json();

      if (data.success) {
        setSaleResult(data);
        setProcessingStep(steps.length);
      } else {
        alert(data.error || "Sale failed");
        setShowProcessing(false);
      }
    } catch (err) {
      alert("Sale failed. Please try again.");
      setShowProcessing(false);
    } finally {
      setSelling(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

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

  if (status === "loading" || loading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.loadingScreen}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const selectedBalance = getSelectedBalance();
  const usdValue = getUsdValue();
  const fee = getFee();
  const netUsd = getNetUsd();

  return (
    <div className={styles.wrapper}>
      <Sidebar />
      <div className={styles.mainContent}>
        <Header />
        <main className={styles.main}>
          {/* Header */}
          <div className={convertStyles.pageHeader}>
            <button className={convertStyles.backBtn} onClick={() => router.push('/crypto')}>
              ← Back to Wallet
            </button>
            <h1 className={convertStyles.pageTitle}>Sell Crypto</h1>
            <p className={convertStyles.pageSubtitle}>Convert your cryptocurrency back to USD</p>
          </div>

          {balances.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
              <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>💰</span>
              <h2 style={{ color: '#fff', marginBottom: '8px' }}>No Crypto Balance</h2>
              <p>You don't have any cryptocurrency to sell.</p>
              <button
                onClick={() => router.push('/crypto/convert')}
                style={{
                  marginTop: '20px', padding: '12px 24px', background: '#c9a962',
                  color: '#1a1f2e', border: 'none', borderRadius: '8px', cursor: 'pointer',
                  fontWeight: 600, fontSize: '14px'
                }}
              >
                Buy Crypto
              </button>
            </div>
          ) : (
            <div className={convertStyles.convertContainer}>
              {/* Form */}
              <div className={convertStyles.formCard}>
                {/* Select Crypto to Sell */}
                <div className={convertStyles.formSection}>
                  <label className={convertStyles.formLabel}>Sell From</label>
                  <div className={convertStyles.cryptoGrid}>
                    {balances.map((crypto) => (
                      <button
                        key={crypto.symbol}
                        className={`${convertStyles.cryptoOption} ${fromCrypto === crypto.symbol ? convertStyles.cryptoActive : ''}`}
                        onClick={() => setFromCrypto(crypto.symbol)}
                      >
                        <span className={convertStyles.cryptoIcon}>{getCryptoIcon(crypto.symbol)}</span>
                        <span className={convertStyles.cryptoSymbol}>{crypto.symbol}</span>
                        <span className={convertStyles.cryptoPrice}>{formatCrypto(crypto.availableBalance, '')}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount */}
                <div className={convertStyles.formSection}>
                  <label className={convertStyles.formLabel}>Amount to Sell</label>
                  <div className={convertStyles.amountInputWrapper}>
                    <input
                      type="number"
                      className={convertStyles.amountInput}
                      placeholder="0.00000000"
                      value={cryptoAmount}
                      onChange={(e) => setCryptoAmount(e.target.value)}
                      step="0.00000001"
                    />
                  </div>
                  {selectedBalance && (
                    <div className={convertStyles.quickAmounts}>
                      {[0.25, 0.5, 0.75, 1].map((pct) => (
                        <button
                          key={pct}
                          className={convertStyles.quickAmountBtn}
                          onClick={() => setCryptoAmount((selectedBalance.availableBalance * pct).toFixed(8))}
                        >
                          {pct === 1 ? 'MAX' : `${pct * 100}%`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Destination Account */}
                <div className={convertStyles.formSection}>
                  <label className={convertStyles.formLabel}>Credit To</label>
                  <div className={convertStyles.accountSelector}>
                    {(['checking', 'savings', 'investment'] as const).map((acc) => (
                      <button
                        key={acc}
                        className={`${convertStyles.accountOption} ${toAccount === acc ? convertStyles.accountActive : ''}`}
                        onClick={() => setToAccount(acc)}
                      >
                        <span className={convertStyles.accountName}>{acc.charAt(0).toUpperCase() + acc.slice(1)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sell Button */}
                <button
                  className={convertStyles.convertBtn}
                  onClick={handleSell}
                  disabled={selling || !cryptoAmount || (parseFloat(cryptoAmount) || 0) <= 0}
                >
                  {selling ? 'Selling...' : 'Sell Now'}
                </button>
              </div>

              {/* Preview Card */}
              <div className={convertStyles.previewCard}>
                <h3 className={convertStyles.previewTitle}>Sale Preview</h3>

                {(parseFloat(cryptoAmount) || 0) > 0 && selectedBalance ? (
                  <>
                    <div className={convertStyles.previewMain}>
                      <div className={convertStyles.previewCrypto}>
                        <span className={convertStyles.previewIcon}>{getCryptoIcon(fromCrypto)}</span>
                        <span className={convertStyles.previewAmount}>
                          {formatCurrency(netUsd)}
                        </span>
                      </div>
                    </div>

                    <div className={convertStyles.previewDetails}>
                      <div className={convertStyles.previewRow}>
                        <span>Selling</span>
                        <span>{formatCrypto(parseFloat(cryptoAmount) || 0, fromCrypto)}</span>
                      </div>
                      <div className={convertStyles.previewRow}>
                        <span>Market Value</span>
                        <span>{formatCurrency(usdValue)}</span>
                      </div>
                      <div className={convertStyles.previewRow}>
                        <span>Fee (1%)</span>
                        <span>-{formatCurrency(fee)}</span>
                      </div>
                      <div className={convertStyles.previewRow}>
                        <span>Rate</span>
                        <span>1 {fromCrypto} = {formatCurrency(selectedBalance.price)}</span>
                      </div>
                      <div className={`${convertStyles.previewRow} ${convertStyles.previewTotal}`}>
                        <span>You Receive</span>
                        <span>{formatCurrency(netUsd)}</span>
                      </div>
                    </div>

                    <div className={convertStyles.previewNote}>
                      <span className={convertStyles.noteIcon}>⚡</span>
                      <span>Sale is instant. USD will be credited to your {toAccount} account immediately.</span>
                    </div>
                  </>
                ) : (
                  <div className={convertStyles.previewEmpty}>
                    <span className={convertStyles.emptyIcon}>💱</span>
                    <p>Enter an amount to see sale preview</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
        <Footer />
      </div>

      {/* Processing Modal */}
      {showProcessing && (
        <div className={convertStyles.modalOverlay}>
          <div className={convertStyles.modalCard}>
            {saleResult ? (
              <div className={convertStyles.successState}>
                <div className={convertStyles.successIcon}>✓</div>
                <h2>Sale Complete!</h2>
                <p className={convertStyles.successAmount}>
                  {formatCurrency(saleResult.sale.toAmount)}
                </p>
                <p className={convertStyles.successSubtext}>
                  has been credited to your {saleResult.sale.toAccount} account
                </p>
                <div className={convertStyles.successDetails}>
                  <div className={convertStyles.detailRow}>
                    <span>Reference</span>
                    <span>{saleResult.reference}</span>
                  </div>
                  <div className={convertStyles.detailRow}>
                    <span>Sold</span>
                    <span>{saleResult.sale.fromAmount.toFixed(8)} {saleResult.sale.fromCurrency}</span>
                  </div>
                  <div className={convertStyles.detailRow}>
                    <span>Fee</span>
                    <span>{formatCurrency(saleResult.sale.fee)}</span>
                  </div>
                  <div className={convertStyles.detailRow}>
                    <span>Credited</span>
                    <span>{formatCurrency(saleResult.sale.toAmount)}</span>
                  </div>
                </div>
                <button
                  className={convertStyles.doneBtn}
                  onClick={() => router.push('/crypto')}
                >
                  View Wallet
                </button>
              </div>
            ) : (
              <div className={convertStyles.processingState}>
                <div className={convertStyles.processingSpinner}></div>
                <h2>Processing Sale...</h2>
                <div className={convertStyles.processingSteps}>
                  {[
                    "Verifying crypto balance",
                    "Fetching live market rates",
                    "Processing sale",
                    "Crediting your account",
                    "Finalizing transaction"
                  ].map((step, idx) => (
                    <div
                      key={idx}
                      className={`${convertStyles.stepItem} ${idx <= processingStep ? convertStyles.stepComplete : ''} ${idx === processingStep ? convertStyles.stepActive : ''}`}
                    >
                      <span className={convertStyles.stepIcon}>
                        {idx < processingStep ? '✓' : idx === processingStep ? '●' : '○'}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SellCryptoPage() {
  return (
    <Suspense fallback={
      <div className={styles.wrapper}>
        <div className={styles.loadingScreen}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading...</p>
        </div>
      </div>
    }>
      <SellCryptoContent />
    </Suspense>
  );
}
