"use client";
import { useState, useEffect, useCallback } from "react";
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

interface RateData {
  mid: number;
  buy: number;
  sell: number;
}

interface LiveRates {
  base: string;
  rates: Record<string, RateData>;
  last_updated: string;
}

const CURRENCY_META: Record<string, { name: string; flag: string }> = {
  EUR: { name: "Euro", flag: "\u{1F1EA}\u{1F1FA}" },
  GBP: { name: "British Pound", flag: "\u{1F1EC}\u{1F1E7}" },
  CHF: { name: "Swiss Franc", flag: "\u{1F1E8}\u{1F1ED}" },
  JPY: { name: "Japanese Yen", flag: "\u{1F1EF}\u{1F1F5}" },
  AUD: { name: "Australian Dollar", flag: "\u{1F1E6}\u{1F1FA}" },
  CAD: { name: "Canadian Dollar", flag: "\u{1F1E8}\u{1F1E6}" },
  SGD: { name: "Singapore Dollar", flag: "\u{1F1F8}\u{1F1EC}" },
  HKD: { name: "Hong Kong Dollar", flag: "\u{1F1ED}\u{1F1F0}" },
  NOK: { name: "Norwegian Krone", flag: "\u{1F1F3}\u{1F1F4}" },
  SEK: { name: "Swedish Krona", flag: "\u{1F1F8}\u{1F1EA}" },
  DKK: { name: "Danish Krone", flag: "\u{1F1E9}\u{1F1F0}" },
  PLN: { name: "Polish Zloty", flag: "\u{1F1F5}\u{1F1F1}" },
  CZK: { name: "Czech Koruna", flag: "\u{1F1E8}\u{1F1FF}" },
  HUF: { name: "Hungarian Forint", flag: "\u{1F1ED}\u{1F1FA}" },
  TRY: { name: "Turkish Lira", flag: "\u{1F1F9}\u{1F1F7}" },
  ZAR: { name: "South African Rand", flag: "\u{1F1FF}\u{1F1E6}" },
  BRL: { name: "Brazilian Real", flag: "\u{1F1E7}\u{1F1F7}" },
  MXN: { name: "Mexican Peso", flag: "\u{1F1F2}\u{1F1FD}" },
  INR: { name: "Indian Rupee", flag: "\u{1F1EE}\u{1F1F3}" },
  CNY: { name: "Chinese Yuan", flag: "\u{1F1E8}\u{1F1F3}" },
};

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

  // Live rates state
  const [liveRates, setLiveRates] = useState<LiveRates | null>(null);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesError, setRatesError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [minutesAgo, setMinutesAgo] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      fetchCurrencies();
      fetchLiveRates();
    }
  }, [status]);

  // Update "minutes ago" every 30 seconds
  useEffect(() => {
    if (!lastUpdated) return;
    const tick = () => {
      setMinutesAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 60000));
    };
    tick();
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

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

  const fetchLiveRates = useCallback(async () => {
    setRatesLoading(true);
    setRatesError("");
    try {
      const res = await fetch("/api/exchange/rates");
      const data = await res.json();
      if (data.success) {
        setLiveRates({ base: data.base, rates: data.rates, last_updated: data.last_updated });
        setLastUpdated(new Date(data.last_updated));
      } else {
        setRatesError("Failed to load live rates");
      }
    } catch (err) {
      console.error("Error fetching live rates:", err);
      setRatesError("Could not connect to rates service");
    } finally {
      setRatesLoading(false);
    }
  }, []);

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

  const formatRate = (val: number, decimals = 4) => val.toFixed(decimals);

  const getTimeAgoText = () => {
    if (minutesAgo < 1) return "Just now";
    if (minutesAgo === 1) return "1 minute ago";
    if (minutesAgo < 60) return `${minutesAgo} minutes ago`;
    const hours = Math.floor(minutesAgo / 60);
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  };

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

          {/* Live Rates Panel */}
          <div className={styles.liveRatesCard}>
            <div className={styles.liveRatesHeader}>
              <div>
                <h2 className={styles.liveRatesTitle}>Live Exchange Rates</h2>
                <p className={styles.liveRatesSubtitle}>
                  Base: USD &middot; Spread: 0.5%
                  {lastUpdated && (
                    <span className={styles.lastUpdated}>
                      {" "}&middot; Last updated: {getTimeAgoText()}
                    </span>
                  )}
                </p>
              </div>
              <button
                className={styles.refreshBtn}
                onClick={fetchLiveRates}
                disabled={ratesLoading}
              >
                {ratesLoading ? "Refreshing..." : "Refresh Rates"}
              </button>
            </div>

            {ratesError && <div className={styles.ratesError}>{ratesError}</div>}

            {liveRates && (
              <div className={styles.ratesTable}>
                <div className={styles.ratesTableHeader}>
                  <span>Currency</span>
                  <span>Mid Rate</span>
                  <span>We Buy (USD)</span>
                  <span>We Sell (USD)</span>
                </div>
                {Object.entries(liveRates.rates).map(([code, rate]) => {
                  const meta = CURRENCY_META[code];
                  return (
                    <div key={code} className={styles.ratesTableRow}>
                      <span className={styles.rateCurrency}>
                        <span className={styles.rateFlag}>{meta?.flag}</span>
                        <span className={styles.rateCode}>{code}</span>
                        <span className={styles.rateName}>{meta?.name}</span>
                      </span>
                      <span className={styles.rateMid}>{formatRate(rate.mid)}</span>
                      <span className={styles.rateBuy}>{formatRate(rate.buy)}</span>
                      <span className={styles.rateSell}>{formatRate(rate.sell)}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {ratesLoading && !liveRates && (
              <div className={styles.ratesLoading}>
                <div className={styles.spinner}></div>
                <p>Loading live rates...</p>
              </div>
            )}
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
                    value={result ? result.formattedConverted : "\u2014"}
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
