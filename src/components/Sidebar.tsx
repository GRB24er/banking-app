// components/Sidebar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import styles from "./Sidebar.module.css";

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
    label: "Overview", 
    href: "/dashboard", 
    icon: "◆"
  },
  { 
    label: "Accounts", 
    href: "/accounts", 
    icon: "●",
    subItems: [
      { label: "Checking", href: "/accounts/checking" },
      { label: "Savings", href: "/accounts/savings" },
      { label: "Investment", href: "/accounts/investment" }
    ]
  },
  { 
    label: "Payments", 
    href: "/transfers", 
    icon: "⬌",
    subItems: [
      { label: "Internal Transfer", href: "/transfers/internal" },
      { label: "Wire Transfer", href: "/transfers/wire" },
      { label: "International", href: "/transfers/international" },
      { label: "Scheduled", href: "/transfers/scheduled" }
    ]
  },
  { 
    label: "Activity", 
    href: "/transactions", 
    icon: "≋",
    badge: 0
  },
  { 
    label: "Cards", 
    href: "/accounts/credit-cards", 
    icon: "▭",
    subItems: [
      { label: "My Cards", href: "/accounts/credit-cards" },
      { label: "Apply for Card", href: "/accounts/credit-cards/apply" },
      { label: "Application Status", href: "/accounts/credit-cards/status" }
    ]
  },
  { 
    label: "Investments", 
    href: "/investments", 
    icon: "▲",
    subItems: [
      { label: "Portfolio", href: "/investments/portfolio" },
      { label: "Trading", href: "/investments/trading" },
      { label: "Research", href: "/investments/research" },
      { label: "Watchlist", href: "/investments/watchlist" }
    ]
  },
  { 
    label: "Bills", 
    href: "/bills", 
    icon: "◐",
    badge: 0
  },
  { 
    label: "Statements", 
    href: "/accounts/statements", 
    icon: "▤"
  },
  { 
    label: "Analytics", 
    href: "/reports", 
    icon: "◓"
  },
  { 
    label: "Admin", 
    href: "/dashboard/admin", 
    icon: "◈",
    requiredRole: ["admin"],
    subItems: [
      { label: "Dashboard", href: "/dashboard/admin" },
      { label: "Credit Cards", href: "/dashboard/admin/credit-cards" },
      { label: "Statements", href: "/dashboard/admin/statements" },
      { label: "Support", href: "/dashboard/admin/chats" },
      { label: "Users", href: "/admin/users" },
      { label: "Approvals", href: "/admin/transactions" },
      { label: "KYC", href: "/admin/kyc" },
      { label: "Settings", href: "/admin/settings" }
    ]
  }
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [userName, setUserName] = useState<string>("User");
  const [userEmail, setUserEmail] = useState<string>("");
  const [pendingTransactions, setPendingTransactions] = useState(0);
  const [pendingBills, setPendingBills] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const [quickBalance, setQuickBalance] = useState({
    checking: 0,
    savings: 0,
    investment: 0
  });

  useEffect(() => {
    const fetchBalances = async () => {
      if (session?.user?.email) {
        try {
          const response = await fetch('/api/user/dashboard');
          if (response.ok) {
            const data = await response.json();
            
            const checking = data.balances?.checking || 0;
            const savings = data.balances?.savings || 0;
            const investment = data.balances?.investment || 0;
            
            setQuickBalance({
              checking: checking,
              savings: savings,
              investment: investment
            });
            
            setUserName(data.user?.name || session.user.name || "User");
            setUserEmail(data.user?.email || session.user.email || "");
            
            const pending = data.recent?.filter((t: any) => 
              t.rawStatus === "pending" || t.status === "Pending"
            ).length || 0;
            setPendingTransactions(pending);
          }
        } catch (error) {
          console.error('Error fetching balances:', error);
          setUserName(session?.user?.name || "User");
          setUserEmail(session?.user?.email || "");
        }
      }
    };
    
    fetchBalances();
    const interval = setInterval(fetchBalances, 30000);
    return () => clearInterval(interval);
  }, [session]);

  const navItemsWithBadges = NAV_ITEMS.map(item => {
    if (item.label === "Activity") {
      return { ...item, badge: pendingTransactions > 0 ? pendingTransactions : undefined };
    }
    if (item.label === "Bills") {
      return { ...item, badge: pendingBills > 0 ? pendingBills : undefined };
    }
    return item;
  });

  const filteredNavItems = navItemsWithBadges.filter(item => {
    if (!item.requiredRole) return true;
    return session?.user?.role === "admin" || 
           session?.user?.email === "admin@horizonbank.com" || 
           session?.user?.email === "admin@example.com";
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
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Cash balance = Checking + Savings only (NO investments)
  const cashBalance = quickBalance.checking + quickBalance.savings;

  return (
    <>
      {mobileOpen && (
        <div 
          className={styles.mobileOverlay}
          onClick={() => setMobileOpen(false)}
        />
      )}

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

      <nav className={`${styles.sidebar} ${mobileOpen ? styles.mobileOpen : ''}`}>
        {/* Header Section */}
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" 
                      fill="currentColor" opacity="0.2"/>
                <path d="M12 2L2 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" 
                      stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className={styles.logoText}>
              <span className={styles.logoTitle}>Horizon Bank</span>
              <span className={styles.logoSubtitle}>Private Banking</span>
            </div>
          </div>
        </div>

        {/* Cash Balance Card - Checking + Savings ONLY */}
        <div className={styles.balanceCard}>
          <div className={styles.balanceHeader}>
            <span className={styles.balanceLabel}>Cash Balance</span>
            <button 
              className={styles.refreshButton}
              onClick={() => window.location.reload()}
              aria-label="Refresh"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 4v6h6M23 20v-6h-6"/>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
              </svg>
            </button>
          </div>
          <div className={styles.balanceAmount}>
            {formatCurrency(cashBalance)}
          </div>
          
          <div className={styles.balanceBreakdown}>
            <div className={styles.breakdownItem}>
              <span className={styles.breakdownDot} style={{background: '#6366f1'}}></span>
              <span className={styles.breakdownLabel}>Checking</span>
              <span className={styles.breakdownValue}>
                {formatCurrency(quickBalance.checking)}
              </span>
            </div>
            <div className={styles.breakdownItem}>
              <span className={styles.breakdownDot} style={{background: '#10b981'}}></span>
              <span className={styles.breakdownLabel}>Savings</span>
              <span className={styles.breakdownValue}>
                {formatCurrency(quickBalance.savings)}
              </span>
            </div>
          </div>

          <button 
            className={styles.quickTransferButton}
            onClick={() => router.push('/transfers/internal')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
            Quick Transfer
          </button>
        </div>

        {/* Investments Card - Separate from Cash */}
        {quickBalance.investment > 0 && (
          <div className={styles.balanceCard} style={{ marginTop: '0.75rem', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%)' }}>
            <div className={styles.balanceHeader}>
              <span className={styles.balanceLabel}>Investments</span>
            </div>
            <div className={styles.balanceAmount} style={{ fontSize: '1.25rem' }}>
              {formatCurrency(quickBalance.investment)}
            </div>
            <button 
              className={styles.quickTransferButton}
              onClick={() => router.push('/investments/portfolio')}
              style={{ marginTop: '0.75rem' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
              View Portfolio
            </button>
          </div>
        )}

        {/* Navigation */}
        <div className={styles.navigation}>
          <div className={styles.navLabel}>NAVIGATE</div>
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href || 
                           pathname.startsWith(item.href + '/');
            const isExpanded = expandedItems.includes(item.label);
            const hasSubItems = item.subItems && item.subItems.length > 0;

            return (
              <div key={item.label} className={styles.navItemWrapper}>
                <div
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                  onClick={() => {
                    if (hasSubItems) {
                      toggleExpand(item.label);
                    } else {
                      router.push(item.href);
                    }
                  }}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span className={styles.navText}>{item.label}</span>
                  
                  {item.badge && item.badge > 0 && (
                    <span className={styles.navBadge}>{item.badge}</span>
                  )}
                  
                  {hasSubItems && (
                    <svg 
                      className={`${styles.expandIcon} ${isExpanded ? styles.expandIconOpen : ''}`}
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                    >
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  )}
                </div>

                {hasSubItems && isExpanded && (
                  <div className={styles.subItems}>
                    {item.subItems!.map((subItem) => (
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
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* User Profile Section */}
        <div className={styles.userSection}>
          <div className={styles.userCard}>
            <div className={styles.userAvatar}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{userName}</div>
              <div className={styles.userEmail}>{userEmail}</div>
            </div>
            <button 
              className={styles.userMenu}
              onClick={() => router.push('/settings')}
              aria-label="Settings"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>
              </svg>
            </button>
          </div>

          <div className={styles.securityBadge}>
            <svg className={styles.securityIcon} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L4 7v6c0 4.52 3.13 8.75 8 9.88 4.87-1.13 8-5.36 8-9.88V7l-8-5z"/>
            </svg>
            <span>Secure Session</span>
          </div>
        </div>
      </nav>
    </>
  );
}