// src/app/dashboard/page.tsx
"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TransactionTable, { Transaction } from "@/components/TransactionTable";
import styles from "./dashboard.module.css";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

interface RawTxn {
  reference: string;
  description?: string;
  amount: number;
  date: string;
  status?: string;
  rawStatus?: string;
  accountType?: string;
  type?: string;
  currency?: string;
}

interface DashboardResponse {
  balances: {
    checking: number;
    savings: number;
    investment: number;
  };
  recent: RawTxn[];
  user?: {
    name: string;
    email?: string;
  };
  error?: string;
}

interface FullTxn {
  _id: string;
  type: string;
  amount: number;
  adjustedAmount: number;
  date: string;
  status: string;
  accountType: string;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function DashboardPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [allTransactions, setAllTransactions] = useState<FullTxn[]>([]);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated") {
      setLoading(true);
      setError(null);

      // Fetch dashboard data and full transactions in parallel
      Promise.all([
        fetch("/api/user/dashboard", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include"
        }).then(async (res) => {
          const contentType = res.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Server returned non-JSON response");
          }
          const jsonData = await res.json();
          if (!res.ok) {
            throw new Error(jsonData.error || `HTTP error! status: ${res.status}`);
          }
          return jsonData as DashboardResponse;
        }),
        fetch("/api/transactions?limit=200", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include"
        }).then(async (res) => {
          if (!res.ok) return { transactions: [] };
          const json = await res.json();
          return json;
        }).catch(() => ({ transactions: [] }))
      ])
        .then(([dashboardData, txData]) => {
          setData(dashboardData);
          setAllTransactions(txData.transactions || []);
          setError(null);
        })
        .catch((err) => {
          console.error("Dashboard fetch error:", err);
          setError(err.message || "Failed to load dashboard data");
          setData({
            balances: { checking: 0, savings: 0, investment: 0 },
            recent: [],
            user: {
              name: session?.user?.name || "User",
              email: session?.user?.email || ""
            }
          });
        })
        .finally(() => setLoading(false));
    }
  }, [status, router, session]);

  // Build chart data from real transactions
  const monthlyChartData = useMemo(() => {
    if (!allTransactions || allTransactions.length === 0) return [];

    const now = new Date();
    // Look at last 6 months
    const months: { key: string; label: string; income: number; spending: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: MONTH_NAMES[d.getMonth()],
        income: 0,
        spending: 0,
      });
    }

    const debitTypes = ["transfer-out", "withdrawal", "payment", "fee", "charge", "purchase", "withdraw"];

    for (const tx of allTransactions) {
      if (tx.status !== "completed" && tx.status !== "approved") continue;
      const txDate = new Date(tx.date);
      const txKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, "0")}`;
      const bucket = months.find(m => m.key === txKey);
      if (!bucket) continue;

      const isDebit = debitTypes.includes(tx.type) || (tx.adjustedAmount !== undefined && tx.adjustedAmount < 0);
      if (isDebit) {
        bucket.spending += Math.abs(tx.amount);
      } else {
        bucket.income += Math.abs(tx.amount);
      }
    }

    return months;
  }, [allTransactions]);

  // Build per-account balance trend from transactions (last 30 days daily)
  const buildAccountTrend = useMemo(() => {
    return (accountType: string, currentBalance: number) => {
      if (!allTransactions || allTransactions.length === 0) return [];

      const now = new Date();
      const days = 30;
      const points: { day: number; value: number }[] = [];

      // Filter relevant transactions for this account, sorted newest first
      const acctTxns = allTransactions
        .filter(tx => tx.accountType === accountType && (tx.status === "completed" || tx.status === "approved"))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Walk backwards from today
      let balance = currentBalance;
      const dayBalances: number[] = new Array(days).fill(0);
      dayBalances[days - 1] = balance;

      // For each day going backwards, subtract credits and add back debits
      const debitTypes = ["transfer-out", "withdrawal", "payment", "fee", "charge", "purchase", "withdraw"];
      for (let d = days - 1; d >= 0; d--) {
        const dayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1 - d));
        const dayStart = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate());
        const dayEnd = new Date(dayStart.getTime() + 86400000);

        // Find transactions on this day
        const dayTxns = acctTxns.filter(tx => {
          const td = new Date(tx.date);
          return td >= dayStart && td < dayEnd;
        });

        if (d < days - 1) {
          // Start from next day's balance and reverse transactions of the next day
          dayBalances[d] = dayBalances[d + 1];
          // Reverse each transaction that happened on day d+1
          const nextDayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 2 - d));
          const nextDayStart = new Date(nextDayDate.getFullYear(), nextDayDate.getMonth(), nextDayDate.getDate());
          const nextDayEnd = new Date(nextDayStart.getTime() + 86400000);
          const nextDayTxns = acctTxns.filter(tx => {
            const td = new Date(tx.date);
            return td >= nextDayStart && td < nextDayEnd;
          });
          for (const tx of nextDayTxns) {
            const isDebit = debitTypes.includes(tx.type) || (tx.adjustedAmount !== undefined && tx.adjustedAmount < 0);
            if (isDebit) {
              dayBalances[d] += Math.abs(tx.amount); // reverse debit
            } else {
              dayBalances[d] -= Math.abs(tx.amount); // reverse credit
            }
          }
        }
      }

      return dayBalances.map((val, i) => ({ day: i + 1, value: Math.max(0, Math.round(val)) }));
    };
  }, [allTransactions]);

  // Loading State
  if (status === "loading" || loading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.loadingScreen}>
          <div className={styles.loadingContent}>
            <div className={styles.loadingLogo}>
              <div className={styles.loadingLogoIcon}>H</div>
              <div className={styles.loadingPulse}></div>
            </div>
            <div className={styles.loadingText}>Loading your dashboard</div>
            <div className={styles.loadingDots}>
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error && !data) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.errorScreen}>
          <div className={styles.errorCard}>
            <div className={styles.errorIcon}>!</div>
            <h2 className={styles.errorTitle}>Connection Error</h2>
            <p className={styles.errorMessage}>{error}</p>
            <button onClick={() => window.location.reload()} className={styles.retryBtn}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Data extraction
  const userName = data?.user?.name || session?.user?.name || "User";
  const firstName = userName.split(' ')[0];
  const { balances, recent } = data;

  const checkingBalance = balances.checking || 0;
  const savingsBalance = balances.savings || 0;
  const investmentBalance = balances.investment || 0;
  const cashBalance = checkingBalance + savingsBalance;

  // Time-based greeting
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Processing count
  const processingCount = recent.filter(t =>
    t.rawStatus === "pending" || t.status === "Processing"
  ).length;

  // Compute month-over-month change from real data
  const getMonthChange = () => {
    if (monthlyChartData.length < 2) return null;
    const current = monthlyChartData[monthlyChartData.length - 1];
    const prev = monthlyChartData[monthlyChartData.length - 2];
    const currentNet = current.income - current.spending;
    const prevNet = prev.income - prev.spending;
    if (prevNet === 0 && currentNet === 0) return null;
    if (prevNet === 0) return currentNet > 0 ? "+100%" : "-100%";
    const pct = ((currentNet - prevNet) / Math.abs(prevNet)) * 100;
    const sign = pct >= 0 ? "+" : "";
    return `${sign}${pct.toFixed(1)}%`;
  };
  const monthChange = getMonthChange();

  // Account configs -- use real trends
  const accounts = [
    {
      id: "checking",
      type: "Checking",
      name: "Premier Checking",
      accountNum: "****4521",
      balance: checkingBalance,
      available: checkingBalance,
      icon: "\uD83D\uDCB3",
      color: "#6366f1",
      gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
      chartData: buildAccountTrend("checking", checkingBalance),
      badge: null
    },
    {
      id: "savings",
      type: "Savings",
      name: "High-Yield Savings",
      accountNum: "****7832",
      balance: savingsBalance,
      available: savingsBalance,
      icon: "\uD83C\uDFE6",
      color: "#10b981",
      gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      chartData: buildAccountTrend("savings", savingsBalance),
      badge: "4.50% APY"
    },
    {
      id: "investment",
      type: "Investment",
      name: "Investment Portfolio",
      accountNum: "****9103",
      balance: investmentBalance,
      available: investmentBalance * 0.85,
      icon: "\uD83D\uDCC8",
      color: "#f59e0b",
      gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      chartData: buildAccountTrend("investment", investmentBalance),
      badge: investmentBalance > 0 ? "+12.4% YTD" : null
    }
  ];

  // Quick actions
  const quickActions = [
    { icon: "\u2197\uFE0F", title: "Transfer", desc: "Move money", link: "/transfers/internal", color: "#6366f1" },
    { icon: "\uD83D\uDCC4", title: "Pay Bills", desc: "Scheduled payments", link: "/bills", color: "#10b981" },
    { icon: "\uD83D\uDCB0", title: "Deposit", desc: "Add funds", link: "/deposit", color: "#f59e0b" },
    { icon: "\uD83D\uDCCA", title: "Reports", desc: "Analytics", link: "/reports", color: "#ec4899" },
  ];

  // Format currency
  const formatCurrency = (amount: number, compact = false) => {
    if (compact && amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(2)}M`;
    }
    if (compact && amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Transform transactions
  const transactions: Transaction[] = recent.slice(0, 8).map((t) => {
    const isDebit = ['transfer-out', 'withdrawal', 'payment', 'fee', 'charge', 'purchase', 'withdraw'].includes(t.type || '');
    const displayAmount = isDebit ? -Math.abs(t.amount) : Math.abs(t.amount);

    // Map status correctly - Transaction type only accepts: Completed, Pending, Failed, Processing, Cancelled
    let mappedStatus: "Completed" | "Pending" | "Failed" | "Processing" | "Cancelled" = "Processing";
    if (t.status === "Completed" || t.rawStatus === "completed" || t.rawStatus === "approved") {
      mappedStatus = "Completed";
    } else if (t.status === "Pending" || t.rawStatus === "pending") {
      mappedStatus = "Processing";
    } else if (t.status === "Rejected" || t.rawStatus === "rejected") {
      mappedStatus = "Failed";
    } else if (t.status === "Cancelled" || t.rawStatus === "cancelled") {
      mappedStatus = "Cancelled";
    }

    return {
      id: t.reference,
      description: t.description || "Transaction",
      amount: displayAmount,
      status: mappedStatus,
      date: new Date(t.date).toISOString(),
      category: t.accountType ? t.accountType.charAt(0).toUpperCase() + t.accountType.slice(1) : "General",
      type: isDebit ? "debit" : "credit",
      reference: t.reference,
      method: "Bank Transfer",
      balance: 0
    };
  });

  // Hero chart: use real balance trend for cash (checking + savings combined)
  const heroChartData = useMemo(() => {
    if (!allTransactions || allTransactions.length === 0) return [];
    const checkingTrend = buildAccountTrend("checking", checkingBalance);
    const savingsTrend = buildAccountTrend("savings", savingsBalance);
    if (checkingTrend.length === 0 && savingsTrend.length === 0) return [];
    const len = Math.max(checkingTrend.length, savingsTrend.length);
    const combined: { day: number; value: number }[] = [];
    for (let i = 0; i < len; i++) {
      combined.push({
        day: i + 1,
        value: (checkingTrend[i]?.value || 0) + (savingsTrend[i]?.value || 0),
      });
    }
    return combined;
  }, [allTransactions, checkingBalance, savingsBalance, buildAccountTrend]);

  const hasActivity = allTransactions.length > 0 || recent.length > 0;

  return (
    <div className={styles.wrapper}>
      <Sidebar />

      <div className={styles.mainContent}>
        <Header />

        <main className={styles.dashboard}>
          {/* Hero Section */}
          <section className={styles.hero}>
            <div className={styles.heroMain}>
              <div className={styles.heroGreeting}>
                <span className={styles.greetingText}>{getGreeting()},</span>
                <h1 className={styles.heroName}>{firstName}</h1>
              </div>

              <div className={styles.heroBalance}>
                <div className={styles.balanceLabel}>Cash Balance</div>
                <div className={styles.balanceValue}>{formatCurrency(cashBalance)}</div>
                {investmentBalance > 0 && (
                  <div className={styles.balanceBreakdown}>
                    <span>Investments: {formatCurrency(investmentBalance, true)}</span>
                  </div>
                )}
              </div>

              {cashBalance > 0 && (
                <div className={styles.heroStats}>
                  <div className={styles.statItem}>
                    <div className={styles.statValue}>{monthChange || "--"}</div>
                    <div className={styles.statLabel}>This Month</div>
                  </div>
                  <div className={styles.statDivider}></div>
                  <div className={styles.statItem}>
                    <div className={styles.statValue}>{accounts.filter(a => a.balance > 0).length}</div>
                    <div className={styles.statLabel}>Active Accounts</div>
                  </div>
                  <div className={styles.statDivider}></div>
                  <div className={styles.statItem}>
                    <div className={styles.statValue}>{recent.length}</div>
                    <div className={styles.statLabel}>Transactions</div>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.heroChart}>
              {heroChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={120}>
                  <AreaChart data={heroChartData}>
                    <defs>
                      <linearGradient id="heroGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity={0.3}/>
                        <stop offset="100%" stopColor="#ffffff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#ffffff"
                      strokeWidth={2}
                      fill="url(#heroGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : cashBalance > 0 ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 120, color: "rgba(255,255,255,0.6)", fontSize: "0.85rem" }}>
                  No activity yet
                </div>
              ) : null}
            </div>
          </section>

          {/* Quick Actions */}
          <section className={styles.quickActions}>
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                className={styles.actionCard}
                onClick={() => router.push(action.link)}
                style={{ '--action-color': action.color } as React.CSSProperties}
              >
                <div className={styles.actionIcon}>{action.icon}</div>
                <div className={styles.actionInfo}>
                  <span className={styles.actionTitle}>{action.title}</span>
                  <span className={styles.actionDesc}>{action.desc}</span>
                </div>
                <div className={styles.actionArrow}>{"\u2192"}</div>
              </button>
            ))}
          </section>

          {/* Accounts Section */}
          <section className={styles.accountsSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>My Accounts</h2>
              <a href="/accounts" className={styles.sectionLink}>View All</a>
            </div>

            <div className={styles.accountsGrid}>
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className={styles.accountCard}
                  style={{ '--card-color': account.color } as React.CSSProperties}
                >
                  <div className={styles.cardHeader}>
                    <div className={styles.cardIcon}>{account.icon}</div>
                    <div className={styles.cardInfo}>
                      <div className={styles.cardName}>{account.name}</div>
                      <div className={styles.cardNumber}>{account.accountNum}</div>
                    </div>
                    {account.badge && (
                      <div className={styles.cardBadge}>{account.badge}</div>
                    )}
                  </div>

                  <div className={styles.cardBalance}>
                    <div className={styles.cardBalanceLabel}>Current Balance</div>
                    <div className={styles.cardBalanceValue}>{formatCurrency(account.balance)}</div>
                    <div className={styles.cardAvailable}>
                      Available: {formatCurrency(account.available)}
                    </div>
                  </div>

                  {account.chartData.length > 0 && account.balance > 0 ? (
                    <div className={styles.cardChart}>
                      <ResponsiveContainer width="100%" height={50}>
                        <AreaChart data={account.chartData}>
                          <defs>
                            <linearGradient id={`grad-${account.id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={account.color} stopOpacity={0.2}/>
                              <stop offset="100%" stopColor={account.color} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke={account.color}
                            strokeWidth={2}
                            fill={`url(#grad-${account.id})`}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : account.balance > 0 ? (
                    <div className={styles.cardChart} style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 50, color: "#9ca3af", fontSize: "0.75rem" }}>
                      No activity yet
                    </div>
                  ) : null}

                  <div className={styles.cardActions}>
                    <button
                      className={styles.cardAction}
                      onClick={() => router.push(`/transfers/internal?from=${account.id}`)}
                    >
                      Transfer
                    </button>
                    <button
                      className={styles.cardAction}
                      onClick={() => router.push(`/accounts/${account.id}`)}
                    >
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Monthly Activity Chart */}
          {monthlyChartData.length > 0 && monthlyChartData.some(m => m.income > 0 || m.spending > 0) && (
            <section className={styles.activitySection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Monthly Activity</h2>
              </div>
              <div className={styles.transactionsCard} style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1rem", fontSize: "0.85rem" }}>
                  <span style={{ color: "#10b981", fontWeight: 600 }}>Income</span>
                  <span style={{ color: "#ef4444", fontWeight: 600 }}>Spending</span>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={monthlyChartData}>
                    <defs>
                      <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2}/>
                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fill="url(#incomeGrad)" />
                    <Area type="monotone" dataKey="spending" stroke="#ef4444" strokeWidth={2} fill="url(#spendGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {/* Recent Activity */}
          <section className={styles.activitySection}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleGroup}>
                <h2 className={styles.sectionTitle}>Recent Activity</h2>
                {processingCount > 0 && (
                  <span className={styles.processingBadge}>{processingCount} Processing</span>
                )}
              </div>
              <a href="/transactions" className={styles.sectionLink}>View All</a>
            </div>

            {transactions.length > 0 ? (
              <div className={styles.transactionsCard}>
                <TransactionTable transactions={transactions} />
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>{"\uD83D\uDCCA"}</div>
                <h3 className={styles.emptyTitle}>No Recent Activity</h3>
                <p className={styles.emptyText}>Your transactions will appear here</p>
              </div>
            )}
          </section>

          {/* Security Footer */}
          <div className={styles.securityBanner}>
            <svg className={styles.securityIcon} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
            </svg>
            <span>Protected by bank-grade 256-bit SSL encryption</span>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
