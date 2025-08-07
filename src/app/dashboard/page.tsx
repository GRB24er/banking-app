"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CountUpNumber from "@/components/CountUpNumber";
import TransactionTable, { Transaction } from "@/components/TransactionTable";
import styles from "./dashboard.module.css";
import { ResponsiveContainer, LineChart, Line } from "recharts";

interface RawTxn {
  reference: string;
  description?: string;
  amount: number;
  date: string;
  status?: string;
  accountType?: string;
}

interface DashboardResponse {
  balances: {
    checking: number;
    savings: number;
    investment: number;
    checkingSpark?: number[];
    savingsSpark?: number[];
    investmentSpark?: number[];
  };
  recent: RawTxn[];
  lastTransactions?: {
    checking?: RawTxn;
    savings?: RawTxn;
    investment?: RawTxn;
  };
}

export default function DashboardPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [ipWarn, setIpWarn] = useState<string | null>(null);

  // Fetch user IP for location detection (basic)
  useEffect(() => {
    fetch("https://api.ipify.org?format=json")
      .then(res => res.json())
      .then(json => {
        const lastIp = window.localStorage.getItem("last_ip");
        if (lastIp && lastIp !== json.ip) {
          setIpWarn(`We noticed a login from a new location (IP: ${json.ip}). If this wasn't you, please contact support.`);
        }
        window.localStorage.setItem("last_ip", json.ip);
      })
      .catch(() => {});
  }, []);

  // Session/auth flow
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/user/dashboard", { credentials: "include" })
        .then((res) => res.json())
        .then((json: DashboardResponse) => setData(json))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [status, router]);

  if (loading || !data) {
    return <div className={styles.loading}>Loading dashboard…</div>;
  }

  // Welcome user (using NextAuth session data)
  const userName =
    session?.user?.name ||
    session?.user?.email?.split("@")[0] ||
    "Customer";

  const {
    balances: { checking, savings, investment, checkingSpark, savingsSpark, investmentSpark },
    recent,
    lastTransactions,
  } = data;

  const totalBalance = checking + savings + investment;
  const toSparkData = (arr?: number[]) => (arr ?? []).map((v) => ({ value: v }));

  // Simulate last txns if not provided by API
  const lastTxns = lastTransactions || {
    checking: recent.find((t) => t.accountType === "checking") || recent[0],
    savings: recent.find((t) => t.accountType === "savings") || recent[1],
    investment: recent.find((t) => t.accountType === "investment") || recent[2],
  };

  const sections = [
    {
      title: "Checking",
      balance: checking,
      spark: checkingSpark,
      color: "#4F46E5",
      lastTransaction: lastTxns.checking,
    },
    {
      title: "Savings",
      balance: savings,
      spark: savingsSpark,
      color: "#22D3EE",
      lastTransaction: lastTxns.savings,
    },
    {
      title: "Investment",
      balance: investment,
      spark: investmentSpark,
      color: "#10B981",
      lastTransaction: lastTxns.investment,
    },
  ];

  const txns: Transaction[] = recent.map((t) => {
    const rawStatus = typeof t.status === "string" ? t.status : "pending";
    const statusLabel = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);
    const rawAcct = typeof t.accountType === "string" ? t.accountType : "checking";
    const category = rawAcct.charAt(0).toUpperCase() + rawAcct.slice(1);
    return {
      id: t.reference,
      description: t.description ?? t.reference,
      amount: t.amount,
      status: statusLabel,
      date: t.date,
      category,
    };
  });

  return (
    <div className={styles.wrapper}>
      <aside className={styles.sidebar}>
        <Sidebar />
      </aside>
      <div className={styles.main}>
        <header className={styles.header}>
          <Header />
        </header>
        <div className={styles.content}>
          {/* --- Welcome Banner --- */}
          <div className={styles.welcomeBanner}>
            <div className={styles.bannerOverlay}>
              <h2>
                Welcome, <span className={styles.userName}>{userName}</span>
              </h2>
              <p className={styles.subtitle}>
                Here’s an overview of your accounts. Your total balance across all accounts is&nbsp;
                <span className={styles.totalBalance}>
                  ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </p>
            </div>
          </div>
          {/* --- Location Warning --- */}
          {ipWarn && (
            <div className={styles.ipWarning}>
              {ipWarn}
            </div>
          )}
  {/* --- Account Overview Section --- */}
<div className={styles.accountOverviewSection}>
  <div className={styles.overviewBanner}>
  <div className={styles.bannerOverlay}>
    <h3 className={styles.sectionTitle}>
      <span role="img" aria-label="bank" style={{ marginRight: 6 }}>🏦</span>
      Account Overview
    </h3>
  </div>
</div>

  <div className={styles.accountGrid}>
    {sections.map(({ title, balance, spark, color, lastTransaction }, idx) => {
      // Masked account numbers: e.g. ...1000, ...2000, ...3000
      const maskedNumber = `••••${(1000 * (idx + 1)).toString().padStart(4, '0')}`;
      return (
        <div
          key={title}
          className={styles.accountCard}
          style={{ "--accent-color": color } as React.CSSProperties}
        >
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>{title} Account</span>
            <span className={styles.maskedNumber}>{maskedNumber}</span>
          </div>
          <div className={styles.balanceSection}>
            <span className={styles.balanceLabel}>Available Balance</span>
            <span className={styles.cardBalance}>
              <CountUpNumber value={balance} prefix="$" decimals={2} />
            </span>
          </div>
          <div className={styles.balanceSection}>
            <span className={styles.balanceLabel}>Current Balance</span>
            <span className={styles.currentBalance}>
              <CountUpNumber value={balance} prefix="$" decimals={2} />
            </span>
          </div>
          <div className={styles.sparkChart}>
            <ResponsiveContainer width="100%" height={50}>
              <LineChart data={toSparkData(spark)}>
                <Line dataKey="value" stroke={color} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className={styles.lastTransaction}>
            <span className={styles.lastTxnLabel}>Last Transaction:</span>
            {lastTransaction ? (
              <div className={styles.lastTxnDetails}>
                <span className={styles.lastTxnDate}>
                  {lastTransaction.date
                    ? new Date(lastTransaction.date).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "--"}
                </span>
                <span className={styles.lastTxnDesc}>
                  {lastTransaction.description || "--"}
                </span>
                <span className={styles.lastTxnAmount}>
                  {lastTransaction.amount >= 0 ? "+" : "-"}${Math.abs(lastTransaction.amount ?? 0).toFixed(2)}
                </span>
              </div>
            ) : (
              <span className={styles.noTxn}>No recent transaction</span>
            )}
          </div>
        </div>
      );
    })}
  </div>
</div>

          {/* --- Recent Transactions --- */}
          <div className={styles.transactionsSection}>
            <TransactionTable transactions={txns} />
          </div>
          <footer className={styles.footer}>
            <Footer />
          </footer>
        </div>
      </div>
    </div>
  );
}
