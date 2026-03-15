"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import styles from "./AdminSidebar.module.css";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
  children?: NavItem[];
}

const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard/admin", icon: "📊" },
  { label: "Credit Cards", href: "/dashboard/admin/credit-cards", icon: "💳" },
  { label: "Virtual Cards", href: "/dashboard/admin/cards", icon: "🎴", badge: 0 },
  { label: "Loan Applications", href: "/dashboard/admin/loans", icon: "💰", badge: 0 },
  { label: "Statements", href: "/dashboard/admin/statements", icon: "📧" },
  { label: "Support Chats", href: "/dashboard/admin/chats", icon: "💬" },
  { label: "Check Deposits", href: "/dashboard/admin/check-deposits", icon: "📸" },
  {
    label: "User Management",
    href: "/dashboard/admin/users",
    icon: "👥",
    children: [
      { label: "All Users", href: "/dashboard/admin/users/all", icon: "👤" },
      { label: "Pending", href: "/dashboard/admin/users/pending", icon: "⏳" }
    ]
  },
  { label: "Transactions", href: "/dashboard/admin/transactions", icon: "💸" },
  { label: "Transfers", href: "/dashboard/admin/transfers", icon: "🔄" },
  { label: "KYC Verification", href: "/dashboard/admin/kyc", icon: "✅" },
  { label: "Fee Management", href: "/dashboard/admin/fees", icon: "💵" },
  { label: "Reports", href: "/dashboard/admin/reports", icon: "📈" },
  { label: "Settings", href: "/dashboard/admin/settings", icon: "⚙️" },
  { label: "User Dashboard", href: "/dashboard", icon: "🏠" }
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<Set<string>>(new Set());
  const [pendingCounts, setPendingCounts] = useState({ cards: 0, loans: 0 });
  const [activeTime, setActiveTime] = useState("");
  const [mounted, setMounted] = useState(false);

  // Only render dynamic content after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    setActiveTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Fetch pending counts
  useEffect(() => {
    const fetchPendingCounts = async () => {
      try {
        const [cardsRes, loansRes] = await Promise.all([
          fetch('/api/admin/cards?status=pending'),
          fetch('/api/admin/loans?status=submitted')
        ]);

        const cardsData = await cardsRes.json();
        const loansData = await loansRes.json();

        setPendingCounts({
          cards: cardsData.cards?.length || 0,
          loans: loansData.applications?.length || 0
        });
      } catch (err) {
        console.error('Error fetching pending counts:', err);
      }
    };

    fetchPendingCounts();
    const interval = setInterval(fetchPendingCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleSubmenu = (label: string) => {
    const newSet = new Set(openSubmenus);
    if (newSet.has(label)) {
      newSet.delete(label);
    } else {
      newSet.add(label);
    }
    setOpenSubmenus(newSet);
  };

  const getNavItems = () => {
    return ADMIN_NAV_ITEMS.map(item => {
      if (item.label === "Virtual Cards" && pendingCounts.cards > 0) {
        return { ...item, badge: pendingCounts.cards };
      }
      if (item.label === "Loan Applications" && pendingCounts.loans > 0) {
        return { ...item, badge: pendingCounts.loans };
      }
      return item;
    });
  };

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
        aria-label="Toggle admin menu"
        aria-expanded={mobileOpen}
      >
        <span className={styles.hamburger} aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>

      <nav
        className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''} ${mobileOpen ? styles.mobileOpen : ''}`}
        style={{ width: collapsed ? 72 : 280 }}
      >
        {/* Logo & Controls */}
        <div className={styles.header}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>🏦</div>
            {!collapsed && (
              <div className={styles.logoText}>
                <div className={styles.logoName}>Horizon Global Capital</div>
                <div className={styles.logoSubtitle}>Admin Portal</div>
              </div>
            )}
          </div>
          <button
            className={styles.collapseToggle}
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand menu" : "Collapse menu"}
          >
            <span className={styles.collapseIcon}>
              {collapsed ? "→" : "←"}
            </span>
          </button>
        </div>

        {/* User Card */}
        {!collapsed && (
          <div className={styles.userCard}>
            <div className={styles.userAvatar}>👨‍💼</div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>
                {session?.user?.name || "System Admin"}
              </div>
              <div className={styles.userRole}>Super Administrator</div>
              <div className={styles.userEmail}>
                {session?.user?.email || "admin@horizonbank.com"}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className={styles.navContainer} role="navigation" aria-label="Admin navigation">
          <div className={styles.navItems}>
            {getNavItems().map((item) => {
              const isActive = pathname === item.href;
              const hasChildren = item.children && item.children.length > 0;
              const isSubmenuOpen = openSubmenus.has(item.label);

              return (
                <div key={item.href} className={styles.navGroup}>
                  <div
                    className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                    onClick={() => {
                      if (!hasChildren) router.push(item.href);
                      else toggleSubmenu(item.label);
                    }}
                    role="button"
                    tabIndex={0}
                    aria-expanded={hasChildren ? isSubmenuOpen : undefined}
                  >
                    <div className={styles.navIcon}>{item.icon}</div>
                    {!collapsed && (
                      <>
                        <span className={styles.navLabel}>{item.label}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className={styles.badge}>
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        )}
                        {hasChildren && (
                          <div className={`${styles.expandIcon} ${isSubmenuOpen ? styles.rotated : ''}`}>
                            ▶
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Submenu */}
                  {hasChildren && !collapsed && isSubmenuOpen && (
                    <div className={styles.submenu}>
                      {item.children!.map((child) => (
                        <div
                          key={child.href}
                          className={`${styles.navItem} ${styles.subItem} ${pathname === child.href ? styles.active : ''}`}
                          onClick={() => router.push(child.href)}
                          role="button"
                          tabIndex={0}
                        >
                          <span className={styles.navIcon}>{child.icon}</span>
                          <span className={styles.navLabel}>{child.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Section */}
        {!collapsed && (
          <div className={styles.footerSection}>
            <div className={styles.statusCard}>
              <div className={styles.statusHeader}>
                <div className={styles.statusIcon}>🔒</div>
                <span className={styles.statusLabel}>Admin Mode Active</span>
              </div>
              <div className={styles.statusDetails}>
                <div className={styles.statusTime}>
                  {mounted ? `Active since ${activeTime}` : "Admin Mode Active"}
                </div>
              </div>
            </div>

            <div className={styles.logoutSection}>
              <button className={styles.logoutBtn} onClick={() => router.push('/dashboard')}>
                <span>🏠</span>
                <span>Back to Dashboard</span>
              </button>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
