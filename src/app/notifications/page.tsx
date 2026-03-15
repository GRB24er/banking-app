"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "transaction" | "security" | "info" | "alert" | "promotion";
  read: boolean;
  date: string;
  icon: string;
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: "1", title: "Deposit Received", message: "A deposit of $2,500.00 has been credited to your checking account.", type: "transaction", read: false, date: new Date(Date.now() - 1000 * 60 * 30).toISOString(), icon: "💰" },
    { id: "2", title: "Security Alert", message: "A new device was used to sign into your account. If this was not you, please secure your account immediately.", type: "security", read: false, date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), icon: "🔒" },
    { id: "3", title: "Wire Transfer Completed", message: "Your wire transfer of $5,000.00 to John Smith has been completed successfully.", type: "transaction", read: false, date: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), icon: "✅" },
    { id: "4", title: "Monthly Statement Ready", message: "Your January 2024 statement is now available for download in the Statements section.", type: "info", read: true, date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), icon: "📄" },
    { id: "5", title: "Card Payment Alert", message: "A payment of $89.99 was made using your credit card ending in 4521 at Amazon.", type: "transaction", read: true, date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), icon: "💳" },
    { id: "6", title: "Low Balance Warning", message: "Your savings account balance has dropped below $1,000. Consider transferring funds to maintain your minimum balance.", type: "alert", read: true, date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), icon: "⚠️" },
    { id: "7", title: "New Feature: Crypto Trading", message: "You can now buy, sell, and trade cryptocurrencies directly from your Horizon account.", type: "promotion", read: true, date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), icon: "🚀" },
    { id: "8", title: "Password Changed", message: "Your account password was successfully changed. If you did not make this change, contact support.", type: "security", read: true, date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), icon: "🔑" },
    { id: "9", title: "International Transfer Pending", message: "Your international transfer of $3,200.00 is being processed and may take 2-3 business days.", type: "transaction", read: true, date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(), icon: "🌍" },
    { id: "10", title: "Account Verification Complete", message: "Your KYC verification has been approved. You now have full access to all banking services.", type: "info", read: true, date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(), icon: "✅" },
  ]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === "unread") return !n.read;
    if (filter === "all") return true;
    return n.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const typeColors: Record<string, { bg: string; color: string }> = {
    transaction: { bg: "#e8f5e9", color: "#2e7d32" },
    security: { bg: "#fce4ec", color: "#c62828" },
    info: { bg: "#e3f2fd", color: "#1565c0" },
    alert: { bg: "#fff8e1", color: "#f57f17" },
    promotion: { bg: "#f3e5f5", color: "#7b1fa2" },
  };

  if (status === "loading") {
    return (
      <div style={wrapperStyle}>
        <Sidebar />
        <div style={mainStyle}>
          <Header />
          <div style={loadingStyle}>Loading notifications...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={wrapperStyle}>
      <Sidebar />
      <div style={mainStyle}>
        <Header />
        <div style={contentStyle}>
          <div style={pageHeaderStyle}>
            <div>
              <h1 style={pageTitleStyle}>Notifications</h1>
              <p style={pageSubtitleStyle}>
                {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "You're all caught up!"}
              </p>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {unreadCount > 0 && (
                <button style={markAllBtnStyle} onClick={markAllRead}>Mark all as read</button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div style={filtersStyle}>
            {[
              { key: "all", label: "All" },
              { key: "unread", label: `Unread (${unreadCount})` },
              { key: "transaction", label: "Transactions" },
              { key: "security", label: "Security" },
              { key: "info", label: "Info" },
              { key: "alert", label: "Alerts" },
            ].map(f => (
              <button
                key={f.key}
                style={filter === f.key ? activeFilterStyle : filterBtnStyle}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Notification List */}
          <div style={listStyle}>
            {filteredNotifications.length === 0 ? (
              <div style={emptyStyle}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔔</div>
                <h3 style={{ color: "#333", marginBottom: 8 }}>No notifications</h3>
                <p style={{ color: "#6c757d", fontSize: 14 }}>
                  {filter === "unread" ? "You have no unread notifications." : "No notifications match this filter."}
                </p>
              </div>
            ) : (
              filteredNotifications.map(notif => (
                <div
                  key={notif.id}
                  style={{ ...notifItemStyle, background: notif.read ? "white" : "#f8f9ff", borderLeft: notif.read ? "3px solid transparent" : `3px solid ${typeColors[notif.type]?.color || "#6c757d"}` }}
                  onClick={() => markAsRead(notif.id)}
                >
                  <div style={notifIconStyle}>{notif.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: 14, fontWeight: notif.read ? 500 : 600, color: "#1a1f2e" }}>{notif.title}</h4>
                        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6c757d", lineHeight: 1.5 }}>{notif.message}</p>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                        <span style={{ fontSize: 12, color: "#999", whiteSpace: "nowrap" }}>{formatDate(notif.date)}</span>
                        <div style={{ display: "flex", gap: 6 }}>
                          <span style={{ ...typeBadgeStyle, background: typeColors[notif.type]?.bg, color: typeColors[notif.type]?.color }}>
                            {notif.type}
                          </span>
                          {!notif.read && <span style={unreadDotStyle} />}
                        </div>
                      </div>
                    </div>
                  </div>
                  <button style={deleteBtnStyle} onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }} title="Delete">
                    &times;
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const wrapperStyle: React.CSSProperties = { display: "flex", minHeight: "100vh", background: "#f0f2f5" };
const mainStyle: React.CSSProperties = { flex: 1, display: "flex", flexDirection: "column", marginLeft: 280, minWidth: 0 };
const contentStyle: React.CSSProperties = { padding: "24px 32px", flex: 1 };
const loadingStyle: React.CSSProperties = { display: "flex", justifyContent: "center", alignItems: "center", height: "60vh", fontSize: 18, color: "#6c757d" };
const pageHeaderStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 };
const pageTitleStyle: React.CSSProperties = { fontSize: 24, fontWeight: 700, color: "#1a1f2e", margin: 0 };
const pageSubtitleStyle: React.CSSProperties = { fontSize: 14, color: "#6c757d", marginTop: 4 };
const markAllBtnStyle: React.CSSProperties = { padding: "8px 16px", border: "1px solid #dee2e6", borderRadius: 8, background: "white", cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#495057" };
const filtersStyle: React.CSSProperties = { display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" };
const filterBtnStyle: React.CSSProperties = { padding: "8px 16px", border: "1px solid #dee2e6", borderRadius: 8, background: "white", cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#495057" };
const activeFilterStyle: React.CSSProperties = { ...filterBtnStyle, background: "#1a1f2e", color: "white", borderColor: "#1a1f2e" };
const listStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 2 };
const emptyStyle: React.CSSProperties = { textAlign: "center", padding: "60px 20px", background: "white", borderRadius: 12 };
const notifItemStyle: React.CSSProperties = { display: "flex", alignItems: "flex-start", gap: 16, padding: "16px 20px", borderRadius: 8, cursor: "pointer", transition: "background 0.15s", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" };
const notifIconStyle: React.CSSProperties = { fontSize: 24, flexShrink: 0, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5", borderRadius: "50%" };
const typeBadgeStyle: React.CSSProperties = { padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600, textTransform: "capitalize" };
const unreadDotStyle: React.CSSProperties = { width: 8, height: 8, borderRadius: "50%", background: "#007bff", flexShrink: 0 };
const deleteBtnStyle: React.CSSProperties = { border: "none", background: "transparent", cursor: "pointer", fontSize: 20, color: "#ccc", padding: "0 4px", flexShrink: 0, lineHeight: 1 };
