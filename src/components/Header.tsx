"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./Header.module.css";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import BankLogo from "@/components/BankLogo";
import AppIcon from "@/components/AppIcon";

const Header = () => {
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState({ messages: 0, transfers: 0 });
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch("/api/user/dashboard", { credentials: "include" });
        const { recent } = await res.json();
        const pendingTransfers = recent.filter((tx: any) => tx.status === "Pending").length;
        setNotifications({
          messages: 2, // Replace with real unread messages
          transfers: pendingTransfers,
        });
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    }
    fetchNotifications();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/send-money", label: "Transfers" },
    { href: "/settings", label: "Settings" },
    { href: "/reports", label: "Reports" },
  ];

  return (
    <header className={styles.header}>
      {/* Logo */}
      <div className={styles.logo} onClick={() => router.push("/dashboard")}>
        <BankLogo width={32} height={32} className={styles.logoImage} />
        <span className={styles.brandName}>Horizon Global Capital</span>
      </div>

      {/* Nav Links */}
      <nav className={styles.navLinks}>
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`${styles.navLink} ${pathname === link.href ? styles.activeLink : ""}`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Notifications + Profile */}
      <div className={styles.iconGroup}>
        <div className={styles.iconWrapper}>
          <AppIcon name="notification" alt="Notifications" />
          {notifications.transfers > 0 && <span className={styles.badge}>{notifications.transfers}</span>}
        </div>
        <div className={styles.iconWrapper}>
          <AppIcon name="mail" alt="Messages" />
          {notifications.messages > 0 && <span className={styles.badge}>{notifications.messages}</span>}
        </div>

        {/* Profile Dropdown */}
        <div className={styles.profile} ref={dropdownRef} onClick={() => setDropdownOpen(!dropdownOpen)}>
          <div className={styles.profilePic}></div>
          <span className={styles.profileName}>{session?.user?.name || "John Doe"}</span>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                className={styles.dropdownMenu}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Link href="/profile" className={styles.dropdownItem}>
                  <AppIcon name="user" size={16} /> Profile
                </Link>
                <Link href="/settings" className={styles.dropdownItem}>
                  <AppIcon name="settings" size={16} /> Settings
                </Link>
                <button
                  className={`${styles.dropdownItem} ${styles.signOutItem}`}
                  onClick={() => signOut()}
                >
                  <AppIcon name="logout" size={16} /> Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Header;
