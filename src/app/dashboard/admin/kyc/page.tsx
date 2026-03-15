"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
interface KYCRequest {
  _id: string;
  userName: string;
  userEmail: string;
  status: string;
  documentType: string;
  submittedAt: string;
  riskLevel: string;
}

export default function AdminKYCPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<KYCRequest[]>([]);
  const [filter, setFilter] = useState("pending");
  const [message, setMessage] = useState({ type: "", text: "" });

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
      <div style={mainStyle}>
        <div style={loadingStyle}>Loading KYC data...</div>
      </div>
    );
  }

  return (
    <div style={mainStyle}>
        <div style={headerStyle}>
          <div>
            <h1 style={titleStyle}>KYC Verification Management</h1>
            <p style={subtitleStyle}>Review and manage customer identity verification requests</p>
          </div>
          <div style={headerActionsStyle}>
            <span style={badgeStyle}>12 Pending</span>
          </div>
        </div>

        {message.text && (
          <div style={{ ...messageStyle, background: message.type === "success" ? "#d4edda" : "#f8d7da", color: message.type === "success" ? "#155724" : "#721c24" }}>
            {message.text}
          </div>
        )}

        {/* Stats */}
        <div style={statsGridStyle}>
          {[
            { label: "Pending Review", value: "12", color: "#f0ad4e", icon: "⏳" },
            { label: "Approved", value: "847", color: "#5cb85c", icon: "✅" },
            { label: "Rejected", value: "23", color: "#d9534f", icon: "❌" },
            { label: "Expired", value: "56", color: "#6c757d", icon: "📅" },
          ].map((stat, i) => (
            <div key={i} style={statCardStyle}>
              <div style={{ fontSize: 28 }}>{stat.icon}</div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: 13, color: "#6c757d" }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={filtersStyle}>
          {["pending", "approved", "rejected", "expired", "all"].map((f) => (
            <button
              key={f}
              style={filter === f ? activeFilterStyle : filterBtnStyle}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={tableWrapperStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Customer</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Document Type</th>
                <th style={thStyle}>Risk Level</th>
                <th style={thStyle}>Submitted</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "John Smith", email: "john@example.com", doc: "Passport", risk: "Low", date: "2024-01-15", status: "pending" },
                { name: "Sarah Wilson", email: "sarah@example.com", doc: "Driver's License", risk: "Medium", date: "2024-01-14", status: "pending" },
                { name: "Michael Brown", email: "michael@example.com", doc: "National ID", risk: "Low", date: "2024-01-13", status: "pending" },
                { name: "Emily Davis", email: "emily@example.com", doc: "Passport", risk: "High", date: "2024-01-12", status: "pending" },
                { name: "Robert Johnson", email: "robert@example.com", doc: "Utility Bill", risk: "Medium", date: "2024-01-11", status: "approved" },
              ].filter(r => filter === "all" || r.status === filter).map((req, i) => (
                <tr key={i} style={trStyle}>
                  <td style={tdStyle}><strong>{req.name}</strong></td>
                  <td style={tdStyle}>{req.email}</td>
                  <td style={tdStyle}>{req.doc}</td>
                  <td style={tdStyle}>
                    <span style={{ ...riskBadgeStyle, background: req.risk === "High" ? "#f8d7da" : req.risk === "Medium" ? "#fff3cd" : "#d4edda", color: req.risk === "High" ? "#721c24" : req.risk === "Medium" ? "#856404" : "#155724" }}>
                      {req.risk}
                    </span>
                  </td>
                  <td style={tdStyle}>{new Date(req.date).toLocaleDateString()}</td>
                  <td style={tdStyle}>
                    <span style={{ ...statusBadgeStyle, background: req.status === "pending" ? "#fff3cd" : req.status === "approved" ? "#d4edda" : "#f8d7da", color: req.status === "pending" ? "#856404" : req.status === "approved" ? "#155724" : "#721c24" }}>
                      {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button style={viewBtnStyle}>Review</button>
                      {req.status === "pending" && (
                        <>
                          <button style={approveBtnStyle}>Approve</button>
                          <button style={rejectBtnStyle}>Reject</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
    </div>
  );
}

const wrapperStyle: React.CSSProperties = { display: "flex", minHeight: "100vh", background: "#f0f2f5" };
const mainStyle: React.CSSProperties = { flex: 1, padding: "24px 32px", minWidth: 0 };
const loadingStyle: React.CSSProperties = { display: "flex", justifyContent: "center", alignItems: "center", height: "60vh", fontSize: 18, color: "#6c757d" };
const headerStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 };
const titleStyle: React.CSSProperties = { fontSize: 24, fontWeight: 700, color: "#1a1f2e", margin: 0 };
const subtitleStyle: React.CSSProperties = { fontSize: 14, color: "#6c757d", marginTop: 4 };
const headerActionsStyle: React.CSSProperties = { display: "flex", gap: 12, alignItems: "center" };
const badgeStyle: React.CSSProperties = { background: "#fff3cd", color: "#856404", padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600 };
const messageStyle: React.CSSProperties = { padding: "12px 16px", borderRadius: 8, marginBottom: 16, fontSize: 14 };
const statsGridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 };
const statCardStyle: React.CSSProperties = { background: "white", padding: "20px 24px", borderRadius: 12, display: "flex", alignItems: "center", gap: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" };
const filtersStyle: React.CSSProperties = { display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" };
const filterBtnStyle: React.CSSProperties = { padding: "8px 16px", border: "1px solid #dee2e6", borderRadius: 8, background: "white", cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#495057" };
const activeFilterStyle: React.CSSProperties = { ...filterBtnStyle, background: "#1a1f2e", color: "white", borderColor: "#1a1f2e" };
const tableWrapperStyle: React.CSSProperties = { background: "white", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" };
const tableStyle: React.CSSProperties = { width: "100%", borderCollapse: "collapse" };
const thStyle: React.CSSProperties = { textAlign: "left", padding: "14px 16px", background: "#f8f9fa", fontSize: 12, fontWeight: 600, color: "#6c757d", textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #dee2e6" };
const trStyle: React.CSSProperties = { borderBottom: "1px solid #f0f0f0" };
const tdStyle: React.CSSProperties = { padding: "14px 16px", fontSize: 14, color: "#333" };
const riskBadgeStyle: React.CSSProperties = { padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600 };
const statusBadgeStyle: React.CSSProperties = { padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600 };
const viewBtnStyle: React.CSSProperties = { padding: "6px 12px", border: "1px solid #dee2e6", borderRadius: 6, background: "white", cursor: "pointer", fontSize: 12, fontWeight: 500 };
const approveBtnStyle: React.CSSProperties = { padding: "6px 12px", border: "none", borderRadius: 6, background: "#28a745", color: "white", cursor: "pointer", fontSize: 12, fontWeight: 500 };
const rejectBtnStyle: React.CSSProperties = { padding: "6px 12px", border: "none", borderRadius: 6, background: "#dc3545", color: "white", cursor: "pointer", fontSize: 12, fontWeight: 500 };
