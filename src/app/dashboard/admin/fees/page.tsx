"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";

interface FeeSchedule {
  id: string;
  name: string;
  category: string;
  amount: number;
  type: "flat" | "percentage";
  status: "active" | "inactive";
  appliesTo: string;
  lastModified: string;
}

export default function AdminFeesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [editingFee, setEditingFee] = useState<string | null>(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [fees] = useState<FeeSchedule[]>([
    { id: "1", name: "Wire Transfer Fee", category: "Transfers", amount: 25, type: "flat", status: "active", appliesTo: "Domestic Wire", lastModified: "2024-01-10" },
    { id: "2", name: "International Wire Fee", category: "Transfers", amount: 45, type: "flat", status: "active", appliesTo: "International Wire", lastModified: "2024-01-10" },
    { id: "3", name: "Monthly Maintenance", category: "Account", amount: 12, type: "flat", status: "active", appliesTo: "Checking Account", lastModified: "2024-01-05" },
    { id: "4", name: "Overdraft Fee", category: "Account", amount: 35, type: "flat", status: "active", appliesTo: "All Accounts", lastModified: "2024-01-05" },
    { id: "5", name: "ATM Fee (Out of Network)", category: "ATM", amount: 3, type: "flat", status: "active", appliesTo: "ATM Withdrawals", lastModified: "2024-01-08" },
    { id: "6", name: "Foreign Transaction Fee", category: "Transactions", amount: 2.5, type: "percentage", status: "active", appliesTo: "International Transactions", lastModified: "2024-01-06" },
    { id: "7", name: "Investment Management Fee", category: "Investment", amount: 0.75, type: "percentage", status: "active", appliesTo: "Investment Accounts", lastModified: "2024-01-03" },
    { id: "8", name: "Paper Statement Fee", category: "Account", amount: 5, type: "flat", status: "inactive", appliesTo: "All Accounts", lastModified: "2023-12-20" },
  ]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
    if (status === "authenticated") {
      setLoading(false);
    }
  }, [status, router]);

  if (status === "loading" || loading) {
    return (
      <div style={wrapperStyle}>
        <AdminSidebar />
        <div style={mainStyle}>
          <div style={loadingStyle}>Loading fee schedules...</div>
        </div>
      </div>
    );
  }

  const categories = [...new Set(fees.map(f => f.category))];

  return (
    <div style={wrapperStyle}>
      <AdminSidebar />
      <div style={mainStyle}>
        <div style={headerStyle}>
          <div>
            <h1 style={titleStyle}>Fee Management</h1>
            <p style={subtitleStyle}>Configure and manage banking fees and charges</p>
          </div>
          <button style={addBtnStyle}>+ Add New Fee</button>
        </div>

        {message.text && (
          <div style={{ ...messageBaseStyle, background: message.type === "success" ? "#d4edda" : "#f8d7da", color: message.type === "success" ? "#155724" : "#721c24" }}>
            {message.text}
          </div>
        )}

        {/* Revenue Summary */}
        <div style={statsGridStyle}>
          {[
            { label: "Monthly Fee Revenue", value: "$45,230", icon: "💰", color: "#28a745" },
            { label: "Active Fee Types", value: fees.filter(f => f.status === "active").length.toString(), icon: "📋", color: "#007bff" },
            { label: "Fee Waivers (MTD)", value: "127", icon: "🎫", color: "#ffc107" },
            { label: "Avg Fee per Account", value: "$8.45", icon: "📊", color: "#6f42c1" },
          ].map((stat, i) => (
            <div key={i} style={statCardStyle}>
              <div style={{ fontSize: 28 }}>{stat.icon}</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: 13, color: "#6c757d" }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Fee Categories */}
        {categories.map(category => (
          <div key={category} style={{ marginBottom: 24 }}>
            <h2 style={categoryTitleStyle}>{category} Fees</h2>
            <div style={tableWrapperStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Fee Name</th>
                    <th style={thStyle}>Amount</th>
                    <th style={thStyle}>Type</th>
                    <th style={thStyle}>Applies To</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Last Modified</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fees.filter(f => f.category === category).map(fee => (
                    <tr key={fee.id} style={trStyle}>
                      <td style={tdStyle}><strong>{fee.name}</strong></td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 600, color: "#1a1f2e" }}>
                          {fee.type === "percentage" ? `${fee.amount}%` : `$${fee.amount.toFixed(2)}`}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ ...typeBadgeStyle, background: fee.type === "percentage" ? "#e8f0fe" : "#f0f7f0", color: fee.type === "percentage" ? "#1a73e8" : "#137333" }}>
                          {fee.type === "percentage" ? "Percentage" : "Flat Fee"}
                        </span>
                      </td>
                      <td style={tdStyle}>{fee.appliesTo}</td>
                      <td style={tdStyle}>
                        <span style={{ ...statusBadgeStyle, background: fee.status === "active" ? "#d4edda" : "#e2e3e5", color: fee.status === "active" ? "#155724" : "#6c757d" }}>
                          {fee.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td style={tdStyle}>{new Date(fee.lastModified).toLocaleDateString()}</td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button style={editBtnStyle} onClick={() => setEditingFee(fee.id)}>Edit</button>
                          <button style={toggleBtnStyle}>
                            {fee.status === "active" ? "Disable" : "Enable"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const wrapperStyle: React.CSSProperties = { display: "flex", minHeight: "100vh", background: "#f0f2f5" };
const mainStyle: React.CSSProperties = { flex: 1, padding: "24px 32px", marginLeft: 280, minWidth: 0 };
const loadingStyle: React.CSSProperties = { display: "flex", justifyContent: "center", alignItems: "center", height: "60vh", fontSize: 18, color: "#6c757d" };
const headerStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 };
const titleStyle: React.CSSProperties = { fontSize: 24, fontWeight: 700, color: "#1a1f2e", margin: 0 };
const subtitleStyle: React.CSSProperties = { fontSize: 14, color: "#6c757d", marginTop: 4 };
const addBtnStyle: React.CSSProperties = { padding: "10px 20px", border: "none", borderRadius: 8, background: "#1a1f2e", color: "white", cursor: "pointer", fontSize: 14, fontWeight: 600 };
const messageBaseStyle: React.CSSProperties = { padding: "12px 16px", borderRadius: 8, marginBottom: 16, fontSize: 14 };
const statsGridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 };
const statCardStyle: React.CSSProperties = { background: "white", padding: "20px 24px", borderRadius: 12, display: "flex", alignItems: "center", gap: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" };
const categoryTitleStyle: React.CSSProperties = { fontSize: 16, fontWeight: 600, color: "#1a1f2e", marginBottom: 12 };
const tableWrapperStyle: React.CSSProperties = { background: "white", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" };
const tableStyle: React.CSSProperties = { width: "100%", borderCollapse: "collapse" };
const thStyle: React.CSSProperties = { textAlign: "left", padding: "14px 16px", background: "#f8f9fa", fontSize: 12, fontWeight: 600, color: "#6c757d", textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #dee2e6" };
const trStyle: React.CSSProperties = { borderBottom: "1px solid #f0f0f0" };
const tdStyle: React.CSSProperties = { padding: "14px 16px", fontSize: 14, color: "#333" };
const typeBadgeStyle: React.CSSProperties = { padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600 };
const statusBadgeStyle: React.CSSProperties = { padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600 };
const editBtnStyle: React.CSSProperties = { padding: "6px 12px", border: "1px solid #dee2e6", borderRadius: 6, background: "white", cursor: "pointer", fontSize: 12, fontWeight: 500 };
const toggleBtnStyle: React.CSSProperties = { padding: "6px 12px", border: "1px solid #dee2e6", borderRadius: 6, background: "#f8f9fa", cursor: "pointer", fontSize: 12, fontWeight: 500 };
