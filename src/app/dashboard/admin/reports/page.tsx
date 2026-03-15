"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";

export default function AdminReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState("overview");
  const [dateRange, setDateRange] = useState("30d");

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
          <div style={loadingStyle}>Loading reports...</div>
        </div>
      </div>
    );
  }

  const reportTypes = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "transactions", label: "Transactions", icon: "💸" },
    { id: "users", label: "User Growth", icon: "👥" },
    { id: "revenue", label: "Revenue", icon: "💰" },
    { id: "compliance", label: "Compliance", icon: "🛡️" },
  ];

  return (
    <div style={wrapperStyle}>
      <AdminSidebar />
      <div style={mainStyle}>
        <div style={headerStyle}>
          <div>
            <h1 style={titleStyle}>Reports & Analytics</h1>
            <p style={subtitleStyle}>Comprehensive banking analytics and reporting dashboard</p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              style={selectStyle}
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </select>
            <button style={exportBtnStyle}>Export PDF</button>
          </div>
        </div>

        {/* Report Tabs */}
        <div style={tabsStyle}>
          {reportTypes.map(r => (
            <button
              key={r.id}
              style={activeReport === r.id ? activeTabStyle : tabStyle}
              onClick={() => setActiveReport(r.id)}
            >
              <span>{r.icon}</span> {r.label}
            </button>
          ))}
        </div>

        {/* Key Metrics */}
        <div style={statsGridStyle}>
          {[
            { label: "Total Deposits", value: "$2.4M", change: "+12.3%", positive: true },
            { label: "Total Withdrawals", value: "$1.8M", change: "+5.7%", positive: false },
            { label: "New Accounts", value: "342", change: "+18.2%", positive: true },
            { label: "Active Users", value: "1,247", change: "+8.9%", positive: true },
            { label: "Avg Transaction", value: "$1,843", change: "-2.1%", positive: false },
            { label: "Fee Revenue", value: "$45.2K", change: "+15.4%", positive: true },
          ].map((stat, i) => (
            <div key={i} style={metricCardStyle}>
              <div style={{ fontSize: 13, color: "#6c757d", marginBottom: 8 }}>{stat.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#1a1f2e" }}>{stat.value}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: stat.positive ? "#28a745" : "#dc3545", marginTop: 4 }}>
                {stat.change} vs prev period
              </div>
            </div>
          ))}
        </div>

        {/* Chart Placeholder */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 24 }}>
          <div style={chartCardStyle}>
            <h3 style={chartTitleStyle}>Transaction Volume</h3>
            <div style={chartPlaceholderStyle}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: "100%", padding: "0 20px" }}>
                {[45, 65, 55, 80, 72, 90, 85, 95, 78, 88, 92, 100].map((h, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ width: "100%", height: `${h}%`, background: "linear-gradient(to top, #1a1f2e, #2d3548)", borderRadius: "4px 4px 0 0", minHeight: 4 }} />
                    <span style={{ fontSize: 10, color: "#999" }}>{["J","F","M","A","M","J","J","A","S","O","N","D"][i]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={chartCardStyle}>
            <h3 style={chartTitleStyle}>Account Distribution</h3>
            <div style={{ padding: 20 }}>
              {[
                { label: "Checking", pct: 45, color: "#1a1f2e" },
                { label: "Savings", pct: 30, color: "#c9a962" },
                { label: "Investment", pct: 15, color: "#5cb85c" },
                { label: "Credit Card", pct: 10, color: "#6f42c1" },
              ].map((item, i) => (
                <div key={i} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                    <span style={{ color: "#333" }}>{item.label}</span>
                    <span style={{ fontWeight: 600 }}>{item.pct}%</span>
                  </div>
                  <div style={{ height: 8, background: "#f0f0f0", borderRadius: 4 }}>
                    <div style={{ height: "100%", width: `${item.pct}%`, background: item.color, borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity Table */}
        <div style={tableCardStyle}>
          <h3 style={{ ...chartTitleStyle, padding: "16px 20px", margin: 0, borderBottom: "1px solid #f0f0f0" }}>Top Transactions This Period</h3>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Reference</th>
                <th style={thStyle}>User</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Amount</th>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { ref: "TXN-001234", user: "John Smith", type: "Wire Transfer", amount: "$52,000", date: "Jan 15, 2024", status: "Completed" },
                { ref: "TXN-001235", user: "Sarah Wilson", type: "Deposit", amount: "$28,500", date: "Jan 14, 2024", status: "Completed" },
                { ref: "TXN-001236", user: "Michael Brown", type: "International Wire", amount: "$15,750", date: "Jan 13, 2024", status: "Pending" },
                { ref: "TXN-001237", user: "Emily Davis", type: "Investment", amount: "$10,000", date: "Jan 12, 2024", status: "Completed" },
                { ref: "TXN-001238", user: "Robert Johnson", type: "Withdrawal", amount: "$8,200", date: "Jan 11, 2024", status: "Completed" },
              ].map((tx, i) => (
                <tr key={i} style={trStyle}>
                  <td style={tdStyle}><code style={{ background: "#f0f0f0", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>{tx.ref}</code></td>
                  <td style={tdStyle}>{tx.user}</td>
                  <td style={tdStyle}>{tx.type}</td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{tx.amount}</td>
                  <td style={tdStyle}>{tx.date}</td>
                  <td style={tdStyle}>
                    <span style={{ padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600, background: tx.status === "Completed" ? "#d4edda" : "#fff3cd", color: tx.status === "Completed" ? "#155724" : "#856404" }}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
const selectStyle: React.CSSProperties = { padding: "8px 12px", border: "1px solid #dee2e6", borderRadius: 8, fontSize: 13, background: "white" };
const exportBtnStyle: React.CSSProperties = { padding: "8px 20px", border: "none", borderRadius: 8, background: "#1a1f2e", color: "white", cursor: "pointer", fontSize: 13, fontWeight: 600 };
const tabsStyle: React.CSSProperties = { display: "flex", gap: 4, marginBottom: 24, background: "white", padding: 4, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" };
const tabStyle: React.CSSProperties = { padding: "10px 20px", border: "none", borderRadius: 8, background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#6c757d", display: "flex", gap: 6, alignItems: "center" };
const activeTabStyle: React.CSSProperties = { ...tabStyle, background: "#1a1f2e", color: "white" };
const statsGridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 };
const metricCardStyle: React.CSSProperties = { background: "white", padding: "20px", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" };
const chartCardStyle: React.CSSProperties = { background: "white", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflow: "hidden" };
const chartTitleStyle: React.CSSProperties = { fontSize: 15, fontWeight: 600, color: "#1a1f2e", padding: "16px 20px 0", margin: 0 };
const chartPlaceholderStyle: React.CSSProperties = { height: 200, padding: "20px 0" };
const tableCardStyle: React.CSSProperties = { background: "white", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflow: "hidden" };
const tableStyle: React.CSSProperties = { width: "100%", borderCollapse: "collapse" };
const thStyle: React.CSSProperties = { textAlign: "left", padding: "12px 16px", background: "#f8f9fa", fontSize: 12, fontWeight: 600, color: "#6c757d", textTransform: "uppercase", letterSpacing: 0.5 };
const trStyle: React.CSSProperties = { borderBottom: "1px solid #f0f0f0" };
const tdStyle: React.CSSProperties = { padding: "12px 16px", fontSize: 14, color: "#333" };
