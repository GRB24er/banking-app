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

  // Fetch actual user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (session?.user?.email) {
        try {
          const response = await fetch('/api/user/dashboard');
          if (response.ok) {
            const data = await response.json();
            
            // Use actual user data
            const total = (data.balances?.checking || 0) + 
                         (data.balances?.savings || 0) + 
                         (data.balances?.investment || 0);
            
            setUserData({
              name: data.user?.name || session.user.name || "User",
              email: session.user.email,
              totalBalance: total
            });
            
            // Set notifications based on pending transactions
            const pendingTx = data.recent?.filter((t: any) => 
              t.rawStatus === "pending" || t.status === "Pending"
            ) || [];
            
            const newNotifications = [];
            if (pendingTx.length > 0) {
              newNotifications.push({
                id: 1,
                title: `${pendingTx.length} pending transaction${pendingTx.length > 1 ? 's' : ''}`,
                time: "Now",
                icon: "⏳"
              });
            }
            
            // Add other notifications
            newNotifications.push(
              { id: 2, title: "Account secured with 2FA", time: "Active", icon: "🔒" },
              { id: 3, title: "Monthly statement available", time: "View", icon: "📄" }
            );
            
            setNotifications(newNotifications);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Use session as fallback
          setUserData({
            name: session?.user?.name || "User",
            email: session?.user?.email || "",
            totalBalance: 0
          });
        }
      }
    };
    
    fetchUserData();
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        {/* Left Section - Logo & Search */}
        <div className={styles.leftSection}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🏦</span>
            <div className={styles.logoText}>
              <span className={styles.bankName}>ZentriBank</span>
              <span className={styles.bankTagline}>Global Capital</span>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <div className={styles.searchContainer}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Search transactions, accounts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              <kbd className={styles.searchShortcut}>⌘K</kbd>
            </div>
          </form>
        </div>

        {/* Right Section - Actions & Profile */}
        <div className={styles.rightSection}>
          {/* Market Info (Optional - can be real-time data) */}
          <div className={styles.marketInfo}>
            <div className={styles.marketItem}>
              <span className={styles.marketLabel}>Balance</span>
              <span className={styles.marketValue}>
                {formatCurrency(userData.totalBalance)}
              </span>
              <span className={styles.marketChange}>
                {userData.totalBalance > 0 ? "Active" : "New"}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className={styles.quickActions}>
            <button 
              className={styles.actionButton} 
              title="Calculator"
              onClick={() => router.push('/tools/calculator')}
            >
              🧮
            </button>
            <button 
              className={styles.actionButton} 
              title="Support"
              onClick={() => router.push('/support')}
            >
              💬
            </button>
          </div>

          {/* Notifications */}
          <div className={styles.notificationWrapper}>
            <button 
              className={styles.notificationButton}
              onClick={() => setShowNotifications(!showNotifications)}
            >
              🔔
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
                  <button className={styles.markAllRead}>Mark all read</button>
                </div>
                <div className={styles.notificationList}>
                  {notifications.map(notif => (
                    <div key={notif.id} className={styles.notificationItem}>
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

          {/* Profile - USING ACTUAL USER DATA */}
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
                  {session?.user?.role === 'admin' ? 'Administrator' : 'Premium Account'}
                </span>
              </div>
              <span className={styles.profileArrow}>▼</span>
            </button>

            {showProfile && (
              <div className={styles.profileDropdown}>
                <div className={styles.profileHeader}>
                  <div className={styles.profileLarge}>
                    {userData.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className={styles.profileFullName}>
                      {userData.name}
                    </p>
                    <p className={styles.profileEmail}>
                      {userData.email || session?.user?.email || ""}
                    </p>
                    {userData.totalBalance > 0 && (
                      <p style={{ 
                        marginTop: '0.5rem', 
                        fontSize: '0.875rem', 
                        color: '#10b981',
                        fontWeight: 'bold'
                      }}>
                        Balance: {formatCurrency(userData.totalBalance)}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className={styles.profileMenu}>
                  <a href="/profile" className={styles.profileMenuItem}>
                    <span>👤</span> My Profile
                  </a>
                  <a href="/settings" className={styles.profileMenuItem}>
                    <span>⚙️</span> Settings
                  </a>
                  <a href="/security" className={styles.profileMenuItem}>
                    <span>🔒</span> Security
                  </a>
                  <a href="/help" className={styles.profileMenuItem}>
                    <span>❓</span> Help & Support
                  </a>
                </div>
                
                <div className={styles.profileFooter}>
                  <button onClick={handleSignOut} className={styles.signOutButton}>
                    <span>🚪</span> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Bar - Date & Status */}
      <div className={styles.bottomBar}>
        <div className={styles.dateTime}>
          <span className={styles.date}>
            {currentTime.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </span>
          <span className={styles.time}>
            {currentTime.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit', 
              second: '2-digit' 
            })}
          </span>
        </div>
      </div>
    </header>
  );
}