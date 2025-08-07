// File: src/components/Sidebar.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  User,
  FileText,
  Settings,
  ChevronLeft,
  Menu,
} from "lucide-react";
import styles from "./Sidebar.module.css";

interface NavItem {
  label: string;
  href: string;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", Icon: BarChart3 },
  { label: "Profile",   href: "/profile",   Icon: User },
  { label: "Reports",   href: "/reports",   Icon: FileText },
  { label: "Settings",  href: "/settings",  Icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        className={styles.mobileToggle}
        onClick={() => setMobileOpen((o) => !o)}
        aria-label="Open sidebar"
      >
        <Menu width={20} height={20} />
      </button>

      <nav
        className={[
          styles.sidebar,
          collapsed && styles.collapsed,
          mobileOpen && styles.mobileOpen,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* Collapse button */}
        <button
          className={styles.collapseBtn}
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            width={20}
            height={20}
            className={collapsed ? styles.rotate180 : ""}
          />
        </button>

        <div className={styles.nav}>
          {NAV_ITEMS.map(({ label, href, Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={[
                  styles.navItem,
                  isActive && styles.active,
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className={styles.icon}>
                  <Icon width={20} height={20} />
                </div>
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
