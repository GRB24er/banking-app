"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Bitcoin,
  Receipt,
  CreditCard,
  Landmark,
  TrendingUp,
  FileText,
  Settings,
  ShieldCheck,
  ChevronRight,
  ArrowRightLeft,
  Send,
  Globe,
  Repeat,
  Coins,
  PieChart,
  BarChart3,
  DollarSign,
  Users,
  CheckCircle,
  Banknote,
} from "lucide-react";
import styles from "./Sidebar.module.css";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [balances, setBalances] = useState({ checking: 0, savings: 0, investment: 0 });

  const isAdmin = session?.user?.email === "admin@horizonbank.com" || 
                  session?.user?.email === "admin@example.com" ||
                  (session?.user as any)?.role === "admin";

  useEffect(() => {
    if (session?.user) {
      setUserName(session.user.name || "User");
      setUserEmail(session.user.email || "");
      
      fetch("/api/user/dashboard")
        .then(res => res.json())
        .then(data => {
          if (data.balances) setBalances(data.balances);
          if (data.user?.name) setUserName(data.user.name);
        })
        .catch(() => {});
    }
  }, [session]);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const toggleExpand = (label: string) => {
    setExpandedItems(prev => 
      prev.includes(label) ? prev.filter(x => x !== label) : [...prev, label]
    );
  };

  const formatMoney = (amt: number) => {
    if (amt >= 1000000) return `$${(amt / 1000000).toFixed(2)}M`;
    if (amt >= 1000) return `$${(amt / 1000).toFixed(1)}K`;
    return `$${amt.toLocaleString()}`;
  };

  const cashBalance = balances.checking + balances.savings;

  return (
    <>
      {mobileOpen && <div className={styles.overlay} onClick={() => setMobileOpen(false)} />}
      
      <button className={styles.mobileBtn} onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
        <span /><span /><span />
      </button>

      <aside className={`${styles.sidebar} ${mobileOpen ? styles.open : ""}`}>
        <div className={styles.logoWrap}>
          <Image src="/images/Logo.png" alt="Horizon Global Capital" width={160} height={150} priority />
        </div>

        <div className={styles.balanceCard}>
          <div className={styles.balanceLabel}>
            <Wallet size={14} />
            <span>Cash Balance</span>
          </div>
          <div className={styles.balanceAmt}>{formatMoney(cashBalance)}</div>
          <div className={styles.balanceBreakdown}>
            <div className={styles.balanceRow}>
              <span className={styles.dot} style={{background:"var(--gold)"}} />
              <span>Checking</span>
              <span className={styles.balanceVal}>{formatMoney(balances.checking)}</span>
            </div>
            <div className={styles.balanceRow}>
              <span className={styles.dot} style={{background:"var(--gold-light)"}} />
              <span>Savings</span>
              <span className={styles.balanceVal}>{formatMoney(balances.savings)}</span>
            </div>
          </div>
          <button className={styles.transferBtn} onClick={() => router.push("/transfers/internal")}>
            <ArrowRightLeft size={14} />
            Quick Transfer
          </button>
        </div>

        <nav className={styles.nav}>
          <div className={styles.navSection}>
            <div className={styles.navTitle}>MAIN MENU</div>

            <Link href="/dashboard" className={`${styles.navLink} ${pathname === "/dashboard" ? styles.active : ""}`}>
              <LayoutDashboard size={18} className={styles.navIcon} />
              <span>Dashboard</span>
            </Link>

            <div className={styles.navGroup}>
              <div className={styles.navLink} onClick={() => toggleExpand("Accounts")}>
                <Wallet size={18} className={styles.navIcon} />
                <span>Accounts</span>
                <ChevronRight size={16} className={`${styles.arrow} ${expandedItems.includes("Accounts") ? styles.arrowOpen : ""}`} />
              </div>
              {expandedItems.includes("Accounts") && (
                <div className={styles.subMenu}>
                  <Link href="/accounts/checking" className={`${styles.subLink} ${pathname === "/accounts/checking" ? styles.active : ""}`}>Checking</Link>
                  <Link href="/accounts/savings" className={`${styles.subLink} ${pathname === "/accounts/savings" ? styles.active : ""}`}>Savings</Link>
                  <Link href="/accounts/investment" className={`${styles.subLink} ${pathname === "/accounts/investment" ? styles.active : ""}`}>Investment</Link>
                </div>
              )}
            </div>

            <div className={styles.navGroup}>
              <div className={styles.navLink} onClick={() => toggleExpand("Transfers")}>
                <ArrowLeftRight size={18} className={styles.navIcon} />
                <span>Transfers</span>
                <ChevronRight size={16} className={`${styles.arrow} ${expandedItems.includes("Transfers") ? styles.arrowOpen : ""}`} />
              </div>
              {expandedItems.includes("Transfers") && (
                <div className={styles.subMenu}>
                  <Link href="/transfers/internal" className={`${styles.subLink} ${pathname === "/transfers/internal" ? styles.active : ""}`}>Internal Transfer</Link>
                  <Link href="/transfers/wire" className={`${styles.subLink} ${pathname === "/transfers/wire" ? styles.active : ""}`}>Wire Transfer</Link>
                  <Link href="/transfers/international" className={`${styles.subLink} ${pathname === "/transfers/international" ? styles.active : ""}`}>International</Link>
                  <Link href="/exchange" className={`${styles.subLink} ${pathname === "/exchange" ? styles.active : ""}`}>Currency Exchange</Link>
                </div>
              )}
            </div>

            <div className={styles.navGroup}>
              <div className={styles.navLink} onClick={() => toggleExpand("Crypto")}>
                <Bitcoin size={18} className={styles.navIcon} />
                <span>Crypto</span>
                <ChevronRight size={16} className={`${styles.arrow} ${expandedItems.includes("Crypto") ? styles.arrowOpen : ""}`} />
              </div>
              {expandedItems.includes("Crypto") && (
                <div className={styles.subMenu}>
                  <Link href="/crypto" className={`${styles.subLink} ${pathname === "/crypto" ? styles.active : ""}`}>Wallet</Link>
                  <Link href="/crypto/convert" className={`${styles.subLink} ${pathname === "/crypto/convert" ? styles.active : ""}`}>Buy / Convert</Link>
                  <Link href="/crypto/send" className={`${styles.subLink} ${pathname === "/crypto/send" ? styles.active : ""}`}>Send Crypto</Link>
                  <Link href="/crypto/transactions" className={`${styles.subLink} ${pathname === "/crypto/transactions" ? styles.active : ""}`}>Transactions</Link>
                </div>
              )}
            </div>

            <Link href="/transactions" className={`${styles.navLink} ${pathname === "/transactions" ? styles.active : ""}`}>
              <Receipt size={18} className={styles.navIcon} />
              <span>Transactions</span>
            </Link>

            <div className={styles.navGroup}>
              <div className={styles.navLink} onClick={() => toggleExpand("Cards")}>
                <CreditCard size={18} className={styles.navIcon} />
                <span>Cards</span>
                <ChevronRight size={16} className={`${styles.arrow} ${expandedItems.includes("Cards") ? styles.arrowOpen : ""}`} />
              </div>
              {expandedItems.includes("Cards") && (
                <div className={styles.subMenu}>
                  <Link href="/cards" className={`${styles.subLink} ${pathname === "/cards" ? styles.active : ""}`}>Virtual Cards</Link>
                  <Link href="/accounts/credit-cards" className={`${styles.subLink} ${pathname === "/accounts/credit-cards" ? styles.active : ""}`}>Credit Cards</Link>
                  <Link href="/accounts/credit-cards/apply" className={`${styles.subLink} ${pathname === "/accounts/credit-cards/apply" ? styles.active : ""}`}>Apply for Card</Link>
                </div>
              )}
            </div>

            <Link href="/loans" className={`${styles.navLink} ${pathname === "/loans" ? styles.active : ""}`}>
              <Landmark size={18} className={styles.navIcon} />
              <span>Loans</span>
            </Link>

            <div className={styles.navGroup}>
              <div className={styles.navLink} onClick={() => toggleExpand("Investments")}>
                <TrendingUp size={18} className={styles.navIcon} />
                <span>Investments</span>
                <ChevronRight size={16} className={`${styles.arrow} ${expandedItems.includes("Investments") ? styles.arrowOpen : ""}`} />
              </div>
              {expandedItems.includes("Investments") && (
                <div className={styles.subMenu}>
                  <Link href="/investments/portfolio" className={`${styles.subLink} ${pathname === "/investments/portfolio" ? styles.active : ""}`}>Portfolio</Link>
                  <Link href="/investments/trading" className={`${styles.subLink} ${pathname === "/investments/trading" ? styles.active : ""}`}>Trading</Link>
                </div>
              )}
            </div>

            <Link href="/bills" className={`${styles.navLink} ${pathname === "/bills" ? styles.active : ""}`}>
              <Banknote size={18} className={styles.navIcon} />
              <span>Bills</span>
            </Link>

            <Link href="/accounts/statements" className={`${styles.navLink} ${pathname === "/accounts/statements" ? styles.active : ""}`}>
              <FileText size={18} className={styles.navIcon} />
              <span>Statements</span>
            </Link>

            {isAdmin && (
              <div className={styles.navGroup}>
                <div className={`${styles.navLink} ${styles.adminLink}`} onClick={() => toggleExpand("Admin")}>
                  <ShieldCheck size={18} className={styles.navIcon} />
                  <span>Admin</span>
                  <ChevronRight size={16} className={`${styles.arrow} ${expandedItems.includes("Admin") ? styles.arrowOpen : ""}`} />
                </div>
                {expandedItems.includes("Admin") && (
                  <div className={styles.subMenu}>
                    <Link href="/dashboard/admin" className={`${styles.subLink} ${pathname === "/dashboard/admin" ? styles.active : ""}`}>Dashboard</Link>
                    <Link href="/admin/users" className={`${styles.subLink} ${pathname === "/admin/users" ? styles.active : ""}`}>Users</Link>
                    <Link href="/admin/transactions" className={`${styles.subLink} ${pathname === "/admin/transactions" ? styles.active : ""}`}>Approvals</Link>
                    <Link href="/admin/crypto" className={`${styles.subLink} ${pathname === "/admin/crypto" ? styles.active : ""}`}>Crypto Approvals</Link>
                    <Link href="/dashboard/admin/cards" className={`${styles.subLink} ${pathname === "/dashboard/admin/cards" ? styles.active : ""}`}>Card Requests</Link>
                    <Link href="/dashboard/admin/loans" className={`${styles.subLink} ${pathname === "/dashboard/admin/loans" ? styles.active : ""}`}>Loan Applications</Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </nav>

        <div className={styles.userSection}>
          <div className={styles.userCard}>
            <div className={styles.avatar}>{userName.charAt(0).toUpperCase()}</div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{userName}</div>
              <div className={styles.userEmail}>{userEmail}</div>
            </div>
            <button className={styles.settingsBtn} onClick={() => router.push("/settings")} aria-label="Settings">
              <Settings size={16} />
            </button>
          </div>
          <div className={styles.security}>
            <ShieldCheck size={12} />
            <span>256-bit Encrypted Session</span>
          </div>
        </div>
      </aside>
    </>
  );
}
