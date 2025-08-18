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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log("Searching for:", searchQuery);
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/auth/signin");
  };

  // Mock notifications
  const notifications = [
    { id: 1, title: "Wire transfer completed", time: "2 hours ago", icon: "✅" },
    { id: 2, title: "New security update", time: "1 day ago", icon: "🔒" },
    { id: 3, title: "Monthly statement ready", time: "3 days ago", icon: "📄" },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        {/* Left Section - Logo & Search */}
        <div className={styles.leftSection}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🏦</span>
            <div className={styles.logoText}>
              <span className={styles.bankName}>Horizon</span>
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
          {/* Market Info */}
          <div className={styles.marketInfo}>
            <div className={styles.marketItem}>
              <span className={styles.marketLabel}>DOW</span>
              <span className={styles.marketValue}>38,654.42</span>
              <span className={styles.marketChange}>+0.23%</span>
            </div>
            <div className={styles.marketDivider}></div>
            <div className={styles.marketItem}>
              <span className={styles.marketLabel}>NASDAQ</span>
              <span className={styles.marketValue}>17,862.23</span>
              <span className={styles.marketChange}>+0.15%</span>
            </div>
            <div className={styles.marketDivider}></div>
            <div className={styles.marketItem}>
              <span className={styles.marketLabel}>S&P 500</span>
              <span className={styles.marketValue}>5,488.21</span>
              <span className={styles.marketChange}>+0.18%</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className={styles.quickActions}>
            <button className={styles.actionButton} title="Calculator">
              🧮
            </button>
            <button className={styles.actionButton} title="Support">
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
              <span className={styles.notificationBadge}>3</span>
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

          {/* Profile */}
          <div className={styles.profileWrapper}>
            <button 
              className={styles.profileButton}
              onClick={() => setShowProfile(!showProfile)}
            >
              <div className={styles.profileAvatar}>
                {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "H"}
              </div>
              <div className={styles.profileInfo}>
                <span className={styles.profileName}>
                  {session?.user?.name || "Hajand Morgan"}
                </span>
                <span className={styles.profileRole}>Premium Account</span>
              </div>
              <span className={styles.profileArrow}>▼</span>
            </button>

            {showProfile && (
              <div className={styles.profileDropdown}>
                <div className={styles.profileHeader}>
                  <div className={styles.profileLarge}>
                    {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "H"}
                  </div>
                  <div>
                    <p className={styles.profileFullName}>
                      {session?.user?.name || "Hajand Morgan"}
                    </p>
                    <p className={styles.profileEmail}>
                      {session?.user?.email || "hajand@horizonbank.com"}
                    </p>
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