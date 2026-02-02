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
  children?: NavItem[];
}

const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard/admin", icon: "📊" },
  { label: "Credit Cards", href: "/dashboard/admin/credit-cards", icon: "💳" },
  { 
    label: "Statements", 
    href: "/dashboard/admin/statements", 
    icon: "📧",
    badge: 3
  },
  { label: "Support Chats", href: "/dashboard/admin/chats", icon: "💬", badge: 7 },
  // ADD THIS LINE:
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
  { 
    label: "KYC Verification", 
    href: "/dashboard/admin/kyc", 
    icon: "✅",
    badge: 12
  },
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

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
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

  return (
    <>
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

      <motion.nav
        className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''} ${mobileOpen ? styles.mobileOpen : ''}`}
        initial={false}
        animate={{
          width: collapsed ? 72 : 280,
          x: mobileOpen ? 0 : undefined
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {/* Logo & Controls */}
        <div className={styles.header}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>🏦</div>
            {!collapsed && (
              <div className={styles.logoText}>
                <div className={styles.logoName}>Horizon Bank</div>
                <div className={styles.logoSubtitle}>Admin Portal</div>
              </div>
            )}
          </div>
          <motion.button
            className={styles.collapseToggle}
            onClick={() => setCollapsed(!collapsed)}
            whileTap={{ scale: 0.95 }}
            aria-label={collapsed ? "Expand menu" : "Collapse menu"}
          >
            <span className={styles.collapseIcon}>
              {collapsed ? "→" : "←"}
            </span>
          </motion.button>
        </div>

        {/* User Card */}
        {!collapsed && (
          <motion.div 
            className={styles.userCard}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
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
          </motion.div>
        )}

        {/* Navigation */}
        <nav className={styles.navContainer} role="navigation" aria-label="Admin navigation">
          <div className={styles.navItems}>
            {ADMIN_NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const hasChildren = item.children && item.children.length > 0;
              const isSubmenuOpen = openSubmenus.has(item.label);

              return (
                <div key={item.href} className={styles.navGroup}>
                  <motion.div
                    className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                    onClick={() => {
                      if (!hasChildren) router.push(item.href);
                      else toggleSubmenu(item.label);
                    }}
                    whileHover={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                    whileTap={{ scale: 0.98 }}
                    role="button"
                    tabIndex={0}
                    aria-expanded={hasChildren ? isSubmenuOpen : undefined}
                  >
                    <div className={styles.navIcon}>{item.icon}</div>
                    {!collapsed && (
                      <>
                        <span className={styles.navLabel}>{item.label}</span>
                        {item.badge && item.badge > 0 && (
                          <motion.span 
                            className={styles.badge}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                          >
                            {item.badge > 99 ? '99+' : item.badge}
                          </motion.span>
                        )}
                        {hasChildren && (
                          <motion.div 
                            className={`${styles.expandIcon} ${isSubmenuOpen ? styles.rotated : ''}`}
                            animate={{ rotate: isSubmenuOpen ? 90 : 0 }}
                          >
                            ▶
                          </motion.div>
                        )}
                      </>
                    )}
                  </motion.div>

                  {/* Submenu */}
                  {hasChildren && !collapsed && isSubmenuOpen && (
                    <motion.div 
                      className={styles.submenu}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      {item.children!.map((child) => (
                        <motion.div
                          key={child.href}
                          className={`${styles.navItem} ${styles.subItem} ${pathname === child.href ? styles.active : ''}`}
                          onClick={() => router.push(child.href)}
                          whileHover={{ backgroundColor: "rgba(255,255,255,0.04)" }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <span className={styles.navIcon}>{child.icon}</span>
                          <span className={styles.navLabel}>{child.label}</span>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

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
                  Active since {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>
            
            <div className={styles.logoutSection}>
              <button className={styles.logoutBtn}>
                <span>🚪</span>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </motion.nav>
    </>
  );
}
