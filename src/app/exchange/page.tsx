"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./exchange.module.css";

interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  decimals: number;
}

interface ConversionResult {
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  targetCurrency: string;
  rate: number;
  fee: number;
  formattedOriginal: string;
  formattedConverted: string;
}

export default function ExchangePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("EUR");
  const [amount, setAmount] = useState("1000");
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      fetchCurrencies();
    }
  }, [status]);

  const fetchCurrencies = async () => {
    try {
      const res = await fetch("/api/currency?action=currencies");
      const data = await res.json();
      if (data.success) {
        setCurrencies(data.currencies || []);
      }
    } catch (err) {
      console.error("Error fetching currencies:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setConverting(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/currency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "convert",
          amount: parseFloat(amount),
          from: fromCurrency,
          to: toCurrency,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Conversion failed");

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setConverting(false);
    }
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setResult(null);
  };

  const getCurrency = (code: string) => currencies.find(c => c.code === code);

  const popularCurrencies = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY"];

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <Sidebar />
        <div className={styles.main}>
          <Header />
          <div className={styles.loadingScreen}>
            <div className={styles.spinner}></div>
            <p>Loading currencies...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <Sidebar />
      <div className={styles.main}>
        <Header />
        <div className={styles.content}>
          {/* Page Header */}
          <div className={styles.pageHeader}>
            <h1>Currency Exchange</h1>
            <p>Convert between 50+ currencies at competitive rates</p>
          </div>

          {/* Exchange Card */}
          <div className={styles.exchangeCard}>
            <div className={styles.exchangeForm}>
              {/* From */}
              <div className={styles.currencySection}>
                <label>From</label>
                <div className={styles.currencyInput}>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setResult(null);
                    }}
                    placeholder="Enter amount"
                  />
                  <select
                    value={fromCurrency}
                    onChange={(e) => {
                      setFromCurrency(e.target.value);
                      setResult(null);
                    }}
                  >
                    {currencies.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.quickCurrencies}>
                  {popularCurrencies.slice(0, 4).map((code) => (
                    <button
                      key={code}
                      className={fromCurrency === code ? styles.active : ""}
                      onClick={() => {
                        setFromCurrency(code);
                        setResult(null);
                      }}
                    >
                      {getCurrency(code)?.flag} {code}
                    </button>
                  ))}
                </div>
              </div>

              {/* Swap Button */}
              <button className={styles.swapBtn} onClick={swapCurrencies}>
                ⇄
              </button>

              {/* To */}
              <div className={styles.currencySection}>
                <label>To</label>
                <div className={styles.currencyInput}>
                  <input
                    type="text"
                    value={result ? result.formattedConverted : "—"}
                    readOnly
                    placeholder="Converted amount"
                  />
                  <select
                    value={toCurrency}
                    onChange={(e) => {
                      setToCurrency(e.target.value);
                      setResult(null);
                    }}
                  >
                    {currencies.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.quickCurrencies}>
                  {popularCurrencies.slice(4).map((code) => (
                    <button
                      key={code}
                      className={toCurrency === code ? styles.active : ""}
                      onClick={() => {
                        setToCurrency(code);
                        setResult(null);
                      }}
                    >
                      {getCurrency(code)?.flag} {code}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Convert Button */}
            <button
              className={styles.convertBtn}
              onClick={handleConvert}
              disabled={converting}
            >
              {converting ? "Converting..." : "Convert"}
            </button>

            {/* Error */}
            {error && <div className={styles.error}>{error}</div>}

            {/* Result */}
            {result && (
              <div className={styles.resultCard}>
                <div className={styles.resultMain}>
                  <span className={styles.resultFrom}>
                    {result.formattedOriginal}
                  </span>
                  <span className={styles.resultEquals}>=</span>
                  <span className={styles.resultTo}>
                    {result.formattedConverted}
                  </span>
                </div>
                <div className={styles.resultDetails}>
                  <div className={styles.resultRow}>
                    <span>Exchange Rate</span>
                    <strong>1 {fromCurrency} = {result.rate.toFixed(4)} {toCurrency}</strong>
                  </div>
                  <div className={styles.resultRow}>
                    <span>Exchange Fee (0.5%)</span>
                    <strong>${result.fee.toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Currency List */}
          <div className={styles.currencyList}>
            <h2>All Currencies</h2>
            <div className={styles.currencyGrid}>
              {currencies.map((c) => (
                <div key={c.code} className={styles.currencyItem}>
                  <span className={styles.currencyFlag}>{c.flag}</span>
                  <div className={styles.currencyInfo}>
                    <span className={styles.currencyCode}>{c.code}</span>
                    <span className={styles.currencyName}>{c.name}</span>
                  </div>
                  <span className={styles.currencySymbol}>{c.symbol}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}
