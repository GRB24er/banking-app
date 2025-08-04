"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";
import AppIcon from "@/components/AppIcon";


const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: "home" },
    { href: "/send-money", label: "Transfers", icon: "money-send" },
    { href: "/settings", label: "Settings", icon: "settings" },
    { href: "/reports", label: "Reports", icon: "bar-chart3" },
  ];

  const toggleCollapse = () => setCollapsed(!collapsed);
  const toggleMobile = () => setMobileOpen(!mobileOpen);

  return (
    <>
      <button className={styles.mobileToggle} onClick={toggleMobile}>
        {mobileOpen ? <AppIcon name="x" /> : <AppIcon name="hamburger" />}
      </button>

      <aside
        className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""} ${
          mobileOpen ? styles.mobileOpen : ""
        }`}
      >
        <button className={styles.collapseBtn} onClick={toggleCollapse}>
          {collapsed ? "→" : "←"}
        </button>

        <nav className={styles.nav}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.navItem} ${pathname === link.href ? styles.active : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              <AppIcon name={link.icon} />
              {!collapsed && <span className={styles.label}>{link.label}</span>}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
