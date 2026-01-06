// src/components/Header.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./Header.module.css";

export default function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userData, setUserData] = useState({
    name: "User",
    email: "",
    totalBalance: 0
  });
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (session?.user?.email) {
        try {
          const response = await fetch('/api/user/dashboard');
          if (response.ok) {
            const data = await response.json();
            
            const total = (data.balances?.checking || 0) + 
                         (data.balances?.savings || 0) + 
                         (data.balances?.investment || 0);
            
            setUserData({
              name: data.user?.name || session.user.name || "User",
              email: session.user.email,
              totalBalance: total
            });
            
            const pendingTx = data.recent?.filter((t: any) => 
              t.rawStatus === "pending" || t.status === "Pending"
            ) || [];
            
            const newNotifications = [];
            if (pendingTx.length > 0) {
              newNotifications.push({
                id: 1,
                title: `${pendingTx.length} pending transaction${pendingTx.length > 1 ? 's' : ''}`,
                time: "Now",
                icon: "⏳",
                type: "pending"
              });
            }
            
            newNotifications.push(
              { id: 2, title: "Account secured with 2FA", time: "Active", icon: "🔒", type: "security" },
              { id: 3, title: "Monthly statement available", time: "View", icon: "📄", type: "info" }
            );
            
            setNotifications(newNotifications);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUserData({
            name: session?.user?.name || "User",
            email: session?.user?.email || "",
            totalBalance: 0
          });
        }
      }
    };
    
    fetchUserData();
    const interval = setInterval(fetchUserData, 60000);
    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/auth/signin");
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(2)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        {/* Search Bar */}
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <div className={styles.searchContainer}>
            <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search transactions, accounts, recipients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            <kbd className={styles.searchShortcut}>⌘K</kbd>
          </div>
        </form>

        {/* Right Section */}
        <div className={styles.rightSection}>
          {/* Balance Display */}
          <div className={styles.balanceDisplay}>
            <span className={styles.balanceLabel}>Portfolio</span>
            <span className={styles.balanceValue}>
              {formatCurrency(userData.totalBalance)}
            </span>
          </div>

          {/* Quick Actions */}
          <div className={styles.quickActions}>
            <button 
              className={styles.actionButton} 
              title="Quick Transfer"
              onClick={() => router.push('/transfers/internal')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
            <button 
              className={styles.actionButton} 
              title="Support"
              onClick={() => router.push('/support')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
          </div>

          {/* Notifications */}
          <div className={styles.notificationWrapper}>
            <button 
              className={styles.notificationButton}
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {notifications.length > 0 && (
                <span className={styles.notificationBadge}>
                  {notifications.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className={styles.notificationDropdown}>
                <div className={styles.dropdownHeader}>
                  <h3>Notifications</h3>
                  <button className={styles.markAllRead}>Clear all</button>
                </div>
                <div className={styles.notificationList}>
                  {notifications.map(notif => (
                    <div 
                      key={notif.id} 
                      className={`${styles.notificationItem} ${styles[`notif${notif.type}`]}`}
                    >
                      <span className={styles.notifIcon}>{notif.icon}</span>
                      <div className={styles.notifContent}>
                        <p className={styles.notifTitle}>{notif.title}</p>
                        <span className={styles.notifTime}>{notif.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className={styles.dropdownFooter}>
                  <a href="/notifications">View all notifications</a>
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className={styles.profileWrapper}>
            <button 
              className={styles.profileButton}
              onClick={() => setShowProfile(!showProfile)}
            >
              <div className={styles.profileAvatar}>
                {userData.name.charAt(0).toUpperCase()}
              </div>
              <div className={styles.profileInfo}>
                <span className={styles.profileName}>
                  {userData.name}
                </span>
                <span className={styles.profileRole}>
                  {session?.user?.role === 'admin' ? 'Administrator' : 'Member'}
                </span>
              </div>
              <svg 
                className={`${styles.profileArrow} ${showProfile ? styles.profileArrowOpen : ''}`}
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>

            {showProfile && (
              <div className={styles.profileDropdown}>
                <div className={styles.profileHeader}>
                  <div className={styles.profileLarge}>
                    {userData.name.charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.profileDetails}>
                    <p className={styles.profileFullName}>
                      {userData.name}
                    </p>
                    <p className={styles.profileEmail}>
                      {userData.email || session?.user?.email || ""}
                    </p>
                    {userData.totalBalance > 0 && (
                      <div className={styles.profileBalance}>
                        <span className={styles.profileBalanceLabel}>Total Balance</span>
                        <span className={styles.profileBalanceValue}>
                          {formatCurrency(userData.totalBalance)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className={styles.profileMenu}>
                  <a href="/profile" className={styles.profileMenuItem}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    My Profile
                  </a>
                  <a href="/settings" className={styles.profileMenuItem}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>
                    </svg>
                    Settings
                  </a>
                  <a href="/security" className={styles.profileMenuItem}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L4 7v6c0 4.52 3.13 8.75 8 9.88 4.87-1.13 8-5.36 8-9.88V7l-8-5z"/>
                    </svg>
                    Security
                  </a>
                  <a href="/help" className={styles.profileMenuItem}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    Help & Support
                  </a>
                </div>
                
                <div className={styles.profileFooter}>
                  <button onClick={handleSignOut} className={styles.signOutButton}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className={styles.statusBar}>
        <div className={styles.statusLeft}>
          <div className={styles.statusItem}>
            <svg className={styles.statusIcon} viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10"/>
            </svg>
            <span>All Systems Operational</span>
          </div>
        </div>
        <div className={styles.statusRight}>
          <div className={styles.timeDisplay}>
            {currentTime.toLocaleDateString('en-US', { 
              weekday: 'short',
              month: 'short', 
              day: 'numeric'
            })}
            <span className={styles.timeSeparator}>•</span>
            {currentTime.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit'
            })}
          </div>
        </div>
      </div>
    </header>
  );
}