// src/app/dashboard/page.tsx
"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TransactionTable, { Transaction } from "@/components/TransactionTable";
import styles from "./dashboard.module.css";
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";

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

export default function DashboardPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated") {
      setLoading(true);
      setError(null);
      
      fetch("/api/user/dashboard", { 
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include" 
      })
        .then(async (res) => {
          const contentType = res.headers.get("content-type");
          
          if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Server returned non-JSON response");
          }
          
          const jsonData = await res.json();
          
          if (!res.ok) {
            throw new Error(jsonData.error || `HTTP error! status: ${res.status}`);
          }
          
          return jsonData;
        })
        .then((jsonData: DashboardResponse) => {
          console.log("Dashboard data received:", jsonData);
          setData(jsonData);
          setError(null);
        })
        .catch((err) => {
          console.error("Dashboard fetch error:", err);
          setError(err.message || "Failed to load dashboard data");
          
          setData({
            balances: {
              checking: 0,
              savings: 0,
              investment: 0,
            },
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

  if (status === "loading" || loading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}>
            <div className={styles.spinnerRing}></div>
            <div className={styles.spinnerRing}></div>
            <div className={styles.spinnerRing}></div>
          </div>
          <p className={styles.loadingText}>Securing your connection...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.errorContainer}>
          <div className={styles.errorCard}>
            <svg className={styles.errorIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
              <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2"/>
              <circle cx="12" cy="16" r="0.5" fill="currentColor"/>
            </svg>
            <h2 className={styles.errorTitle}>Connection Interrupted</h2>
            <p className={styles.errorMessage}>{error}</p>
            <button onClick={() => window.location.reload()} className={styles.retryButton}>
              Reconnect Securely
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const userName = data?.user?.name || session?.user?.name || "User";
  const { balances, recent } = data;
  
  const checkingBalance = balances.checking || 0;
  const savingsBalance = balances.savings || 0;
  const investmentBalance = balances.investment || 0;
  
  const liquidTotal = checkingBalance + savingsBalance;
  const totalNetWorth = checkingBalance + savingsBalance + investmentBalance;
  
  const previousBalance = totalNetWorth * 0.95;
  const balanceChange = totalNetWorth > 0 ? ((totalNetWorth - previousBalance) / previousBalance) * 100 : 0;

  const processingCount = recent.filter(t => 
    t.rawStatus === "pending" || 
    t.status === "Processing"
  ).length;

  const generateSparkData = (currentBalance: number) => {
    const data = [];
    let balance = currentBalance * 0.85;
    for (let i = 0; i < 30; i++) {
      balance += (Math.random() - 0.3) * (currentBalance * 0.03);
      data.push({ value: Math.max(0, balance), index: i });
    }
    data[29] = { value: currentBalance, index: 29 };
    return data;
  };

  const generatePerformanceData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((month, i) => ({
      month,
      value: totalNetWorth * (0.7 + (i * 0.025) + Math.random() * 0.1)
    }));
  };

  const accounts = [
    {
      type: "Checking",
      name: "Premier Checking",
      number: "****1234",
      balance: checkingBalance,
      available: checkingBalance,
      icon: "💎",
      gradient: "emerald",
      sparkData: generateSparkData(checkingBalance),
      description: "Primary operating account"
    },
    {
      type: "Savings",
      name: "High-Yield Savings",
      number: "****5678",
      balance: savingsBalance,
      available: savingsBalance,
      icon: "🌿",
      gradient: "forest",
      sparkData: generateSparkData(savingsBalance),
      apy: "4.50% APY",
      description: "FDIC insured up to $250k"
    },
    {
      type: "Investment",
      name: "Portfolio",
      number: "****9012",
      balance: investmentBalance,
      available: investmentBalance * 0.7,
      icon: "📊",
      gradient: "sage",
      sparkData: generateSparkData(investmentBalance),
      returns: investmentBalance > 0 ? "+12.5% YTD" : "—",
      description: "Diversified holdings"
    },
  ];

  const quickActions = [
    { icon: "↔", title: "Transfer", subtitle: "Move funds", link: "/transfers/internal", color: "emerald" },
    { icon: "⚡", title: "Pay", subtitle: "Bills & payments", link: "/bills", color: "forest" },
    { icon: "⬆", title: "Deposit", subtitle: "Add funds", link: "/deposit", color: "sage" },
    { icon: "📈", title: "Invest", subtitle: "Grow wealth", link: "/analytics", color: "mint" },
  ];

  const transactions: Transaction[] = recent.slice(0, 10).map((t) => {
    const isDebit = [
      'transfer-out',
      'withdrawal', 
      'payment',
      'fee',
      'charge',
      'purchase'
    ].includes(t.type || '') || (t.reference?.includes('-OUT'));
    
    const displayAmount = isDebit ? -Math.abs(t.amount) : Math.abs(t.amount);
    
    return {
      id: t.reference,
      description: t.description || "Transaction",
      amount: displayAmount,
      status: (t.status === "Pending" || t.rawStatus === "pending") ? "Processing" : 
              (t.status === "Completed" ? "Completed" : 
              (t.status === "Rejected" ? "Declined" : "Processing")) as Transaction["status"],
      date: new Date(t.date).toISOString(),
      category: t.accountType ? 
        t.accountType.charAt(0).toUpperCase() + t.accountType.slice(1) : 
        "General",
      type: isDebit ? "debit" : "credit",
      reference: t.reference,
      method: "Bank Transfer",
      balance: 0
    };
  });

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(2)}M`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const performanceData = generatePerformanceData();

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
          {/* Hero Section */}
          <div className={styles.heroSection}>
            <div className={styles.heroGlass}>
              <div className={styles.heroContent}>
                <div className={styles.timeGreeting}>
                  {new Date().getHours() < 12 ? 'Good Morning' : 
                   new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'}
                </div>
                <h1 className={styles.heroName}>{userName}</h1>
                
                <div className={styles.balanceDisplay}>
                  <div className={styles.balanceLabel}>Total Portfolio Value</div>
                  <div className={styles.balanceAmount}>
                    {formatCurrency(totalNetWorth)}
                  </div>
                  {totalNetWorth > 0 && (
                    <div className={styles.balanceBreakdown}>
                      <span className={styles.breakdownItem}>
                        <span className={styles.breakdownDot} style={{background: '#059669'}}></span>
                        Liquid {formatCurrency(liquidTotal)}
                      </span>
                      <span className={styles.breakdownItem}>
                        <span className={styles.breakdownDot} style={{background: '#10b981'}}></span>
                        Invested {formatCurrency(investmentBalance)}
                      </span>
                    </div>
                  )}
                </div>

                {totalNetWorth > 0 && (
                  <div className={styles.performanceIndicator}>
                    <div className={styles.performanceBadge}>
                      <span className={styles.performanceIcon}>
                        {balanceChange >= 0 ? '↗' : '↘'}
                      </span>
                      <span className={styles.performanceValue}>
                        {balanceChange >= 0 ? '+' : ''}{balanceChange.toFixed(2)}%
                      </span>
                      <span className={styles.performanceLabel}>This Month</span>
                    </div>
                  </div>
                )}
              </div>

              {totalNetWorth > 0 && (
                <div className={styles.heroChart}>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={performanceData}>
                      <defs>
                        <linearGradient id="performanceGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis 
                        dataKey="month" 
                        stroke="rgba(255,255,255,0.5)" 
                        style={{ fontSize: '12px' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          background: 'rgba(0,0,0,0.8)',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#10b981"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#performanceGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className={styles.quickActionsGrid}>
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                className={`${styles.actionCard} ${styles[`action${action.color}`]}`}
                onClick={() => router.push(action.link)}
              >
                <div className={styles.actionIcon}>{action.icon}</div>
                <div className={styles.actionContent}>
                  <div className={styles.actionTitle}>{action.title}</div>
                  <div className={styles.actionSubtitle}>{action.subtitle}</div>
                </div>
                <div className={styles.actionArrow}>→</div>
              </button>
            ))}
          </div>

          {/* Accounts Grid */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Accounts Overview</h2>
              <a href="/accounts" className={styles.sectionLink}>
                View Details →
              </a>
            </div>

            <div className={styles.accountsGrid}>
              {accounts.map((account) => (
                <div 
                  key={account.type}
                  className={`${styles.accountCard} ${styles[`card${account.gradient}`]}`}
                >
                  <div className={styles.accountCardHeader}>
                    <div className={styles.accountIcon}>{account.icon}</div>
                    <div className={styles.accountMeta}>
                      <div className={styles.accountName}>{account.name}</div>
                      <div className={styles.accountNumber}>{account.number}</div>
                    </div>
                    <button className={styles.accountMenu}>⋯</button>
                  </div>

                  <div className={styles.accountBalance}>
                    <div className={styles.accountBalanceLabel}>Balance</div>
                    <div className={styles.accountBalanceValue}>
                      {formatCurrency(account.balance)}
                    </div>
                    <div className={styles.accountBalanceInfo}>
                      {account.apy || account.returns || `Available: ${formatCurrency(account.available)}`}
                    </div>
                  </div>

                  {account.balance > 0 && (
                    <div className={styles.accountChart}>
                      <ResponsiveContainer width="100%" height={70}>
                        <AreaChart data={account.sparkData}>
                          <defs>
                            <linearGradient id={`grad-${account.type}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#10b981"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill={`url(#grad-${account.type})`}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  <div className={styles.accountFooter}>
                    <span className={styles.accountDescription}>{account.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transactions Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleWrapper}>
                <h2 className={styles.sectionTitle}>Recent Transactions</h2>
                {processingCount > 0 && (
                  <span className={styles.processingBadge}>
                    {processingCount} Processing
                  </span>
                )}
              </div>
              <a href="/transactions" className={styles.sectionLink}>
                View All →
              </a>
            </div>

            {transactions.length > 0 ? (
              <div className={styles.transactionsWrapper}>
                <TransactionTable transactions={transactions} />
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📊</div>
                <h3 className={styles.emptyTitle}>No Recent Activity</h3>
                <p className={styles.emptyText}>Your transactions will appear here</p>
              </div>
            )}
          </div>

          {/* Security Footer */}
          <div className={styles.securityFooter}>
            <svg className={styles.securityIcon} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L4 7v6c0 4.52 3.13 8.75 8 9.88 4.87-1.13 8-5.36 8-9.88V7l-8-5z"/>
            </svg>
            <span>Bank-grade encryption • FDIC insured • 24/7 fraud monitoring</span>
          </div>
        </div>

        <footer className={styles.footer}>
          <Footer />
        </footer>
      </div>
    </div>
  );
}