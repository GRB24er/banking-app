// components/Sidebar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import styles from "./Sidebar.module.css";
import { motion, AnimatePresence } from "framer-motion";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
  subItems?: { label: string; href: string }[];
  requiredRole?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { 
    label: "Dashboard", 
    href: "/dashboard", 
    icon: "🏠"
  },
  { 
    label: "Accounts", 
    href: "/accounts", 
    icon: "💳",
    subItems: [
      { label: "Checking", href: "/accounts/checking" },
      { label: "Savings", href: "/accounts/savings" },
      { label: "Investment", href: "/accounts/investment" },
      { label: "Credit Cards", href: "/accounts/credit-cards" }
    ]
  },
  { 
    label: "Transactions", 
    href: "/transactions", 
    icon: "📊",
    badge: 0 // Will be updated dynamically
  },
  { 
    label: "Transfers", 
    href: "/transfers", 
    icon: "💸",
    subItems: [
      { label: "Between Accounts", href: "/transfers/internal" },
      { label: "Wire Transfer", href: "/transfers/wire" },
      { label: "International", href: "/transfers/international" },
      { label: "Scheduled", href: "/transfers/scheduled" }
    ]
  },
  { 
    label: "Bill Pay", 
    href: "/bills", 
    icon: "📱",
    badge: 0 // Will be updated dynamically
  },
  { 
    label: "Investments", 
    href: "/investments", 
    icon: "📈",
    subItems: [
      { label: "Portfolio", href: "/investments/portfolio" },
      { label: "Trading", href: "/investments/trading" },
      { label: "Research", href: "/investments/research" },
      { label: "Watchlist", href: "/investments/watchlist" }
    ]
  },
  { 
    label: "Loans", 
    href: "/loans", 
    icon: "🏠"
  },
  { 
    label: "Cards", 
    href: "/cards", 
    icon: "💳"
  },
  { 
    label: "Reports", 
    href: "/reports", 
    icon: "📄"
  },
  { 
    label: "Admin Panel", 
    href: "/admin", 
    icon: "⚙️",
    requiredRole: ["admin"],
    subItems: [
      { label: "User Management", href: "/admin/users" },
      { label: "Transaction Approval", href: "/admin/transactions" },
      { label: "KYC Verification", href: "/admin/kyc" },
      { label: "System Settings", href: "/admin/settings" }
    ]
  },
  { 
    label: "Settings", 
    href: "/settings", 
    icon: "⚙️"
  },
  { 
    label: "Help & Support", 
    href: "/support", 
    icon: "❓"
  }
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [userName, setUserName] = useState<string>("User");
  const [pendingTransactions, setPendingTransactions] = useState(0);
  const [pendingBills, setPendingBills] = useState(0);
  
  // USE ACTUAL USER BALANCES - NO HARDCODING
  const [quickBalance, setQuickBalance] = useState({
    checking: 0,
    savings: 0,
    investment: 0,
    total: 0
  });

  // Fetch real balances from API
  useEffect(() => {
    const fetchBalances = async () => {
      if (session?.user?.email) {
        try {
          const response = await fetch('/api/user/dashboard');
          if (response.ok) {
            const data = await response.json();
            
            // Use ACTUAL balances from the logged-in user
            const checking = data.balances?.checking || 0;
            const savings = data.balances?.savings || 0;
            const investment = data.balances?.investment || 0;
            
            setQuickBalance({
              checking: checking,
              savings: savings,
              investment: investment,
              total: checking + savings // Liquid total (not including investment)
            });
            
            // Set the actual user's name
            setUserName(data.user?.name || session.user.name || "User");
            
            // Count pending transactions for badges
            const pending = data.recent?.filter((t: any) => 
              t.rawStatus === "pending" || t.status === "Pending"
            ).length || 0;
            setPendingTransactions(pending);
          }
        } catch (error) {
          console.error('Error fetching balances:', error);
          // Use session data as fallback
          setUserName(session?.user?.name || "User");
        }
      }
    };
    
    fetchBalances();
    // Refresh every 30 seconds
    const interval = setInterval(fetchBalances, 30000);
    return () => clearInterval(interval);
  }, [session]);

  // Update nav items with dynamic badges
  const navItemsWithBadges = NAV_ITEMS.map(item => {
    if (item.label === "Transactions") {
      return { ...item, badge: pendingTransactions > 0 ? pendingTransactions : undefined };
    }
    if (item.label === "Bill Pay") {
      return { ...item, badge: pendingBills > 0 ? pendingBills : undefined };
    }
    return item;
  });

  // Filter nav items based on user role
  const filteredNavItems = navItemsWithBadges.filter(item => {
    if (!item.requiredRole) return true;
    // Check if user is admin
    return session?.user?.role === "admin" || session?.user?.email === "admin@example.com";
  });

  const toggleExpand = (label: string) => {
    setExpandedItems(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(2)}M`;
    }
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <>
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className={styles.mobileOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Toggle Button */}
      <button
        className={styles.mobileToggle}
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        <span className={styles.hamburger}>
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>

      {/* Sidebar */}
      <motion.nav
        className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''} ${mobileOpen ? styles.mobileOpen : ''}`}
        initial={false}
        animate={{
          width: collapsed ? 80 : 280,
          transition: { duration: 0.3, ease: "easeInOut" }
        }}
      >
        {/* Logo Section */}
        <div className={styles.logoSection}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🏦</span>
            {!collapsed && (
              <div className={styles.logoText}>
                <span className={styles.bankName}>Horizon</span>
                <span className={styles.bankTagline}>Global Banking</span>
              </div>
            )}
          </div>
          <button
            className={styles.collapseBtn}
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? "→" : "←"}
          </button>
        </div>

        {/* Quick Balance Card - ACTUAL USER BALANCES */}
        {!collapsed && (
          <div className={styles.quickBalanceCard}>
            <div className={styles.balanceHeader}>
              <span className={styles.balanceTitle}>Quick Balance</span>
              <button 
                className={styles.refreshBtn} 
                aria-label="Refresh balance"
                onClick={() => window.location.reload()}
              >
                🔄
              </button>
            </div>
            <div className={styles.balanceContent}>
              <div className={styles.balanceItem}>
                <span className={styles.balanceLabel}>Checking</span>
                <span className={styles.balanceAmount}>
                  {formatCurrency(quickBalance.checking)}
                </span>
              </div>
              <div className={styles.balanceItem}>
                <span className={styles.balanceLabel}>Savings</span>
                <span className={styles.balanceAmount}>
                  {formatCurrency(quickBalance.savings)}
                </span>
              </div>
              <div className={styles.balanceDivider}></div>
              <div className={styles.balanceItem}>
                <span className={styles.balanceLabel}>Liquid Total</span>
                <span className={styles.balanceTotalAmount}>
                  {formatCurrency(quickBalance.total)}
                </span>
              </div>
              {/* Investment shown separately if user has investment */}
              {quickBalance.investment > 0 && (
                <div className={styles.balanceItem} style={{ 
                  marginTop: '0.75rem', 
                  paddingTop: '0.75rem', 
                  borderTop: '1px solid rgba(255,255,255,0.1)' 
                }}>
                  <span className={styles.balanceLabel}>Investment</span>
                  <span className={styles.balanceAmount} style={{ 
                    color: '#10b981', 
                    fontWeight: 'bold',
                    fontSize: '1.1rem' 
                  }}>
                    {formatCurrency(quickBalance.investment)}
                  </span>
                </div>
              )}
            </div>
            {/* User info */}
            <div style={{
              marginTop: '1rem',
              paddingTop: '1rem',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              textAlign: 'center',
              opacity: 0.8,
              fontSize: '0.875rem'
            }}>
              {userName}
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <div className={styles.navSection}>
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href || 
                           pathname.startsWith(item.href + '/');
            const isExpanded = expandedItems.includes(item.label);

            return (
              <div key={item.label} className={styles.navItemWrapper}>
                <div
                  className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                  onClick={() => {
                    if (item.subItems) {
                      toggleExpand(item.label);
                    } else {
                      router.push(item.href);
                    }
                  }}
                >
                  <div className={styles.navItemContent}>
                    <span className={styles.navIcon}>{item.icon}</span>
                    {!collapsed && (
                      <>
                        <span className={styles.navLabel}>{item.label}</span>
                        {item.badge && item.badge > 0 && (
                          <span className={styles.navBadge}>{item.badge}</span>
                        )}
                        {item.subItems && (
                          <span className={styles.expandIcon}>
                            {isExpanded ? "▼" : "▶"}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Sub Items */}
                {!collapsed && item.subItems && (
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        className={styles.subItems}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {item.subItems.map((subItem) => (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={`${styles.subItem} ${
                              pathname === subItem.href ? styles.subItemActive : ''
                            }`}
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Section */}
        {!collapsed && (
          <div className={styles.bottomSection}>
            <div className={styles.securityStatus}>
              <span className={styles.securityIcon}>🔒</span>
              <div className={styles.securityText}>
                <span className={styles.securityLabel}>Secure Connection</span>
                <span className={styles.securityDetail}>256-bit SSL</span>
              </div>
            </div>
            
            <div className={styles.lastLogin}>
              <span className={styles.lastLoginLabel}>Last Login</span>
              <span className={styles.lastLoginTime}>
                Today at {new Date().toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>

            <button 
              className={styles.quickTransferBtn}
              onClick={() => router.push('/transfers/internal')}
            >
              <span>💸</span> Quick Transfer
            </button>
          </div>
        )}
      </motion.nav>
    </>
  );
}