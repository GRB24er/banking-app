"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("general");
  const [saved, setSaved] = useState(false);

  const [settings, setSettings] = useState({
    bankName: "Horizon Global Capital",
    supportEmail: "support@horizonbank.com",
    maintenanceMode: false,
    newRegistrations: true,
    twoFactorRequired: true,
    maxLoginAttempts: 5,
    sessionTimeout: 30,
    minTransferAmount: 1,
    maxTransferAmount: 100000,
    maxDailyTransfer: 500000,
    requireApproval: 10000,
    emailNotifications: true,
    smsNotifications: false,
    transactionAlerts: true,
    loginAlerts: true,
    kycRequired: true,
    kycExpiryDays: 365,
    amlThreshold: 10000,
    sanctionsCheck: true,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
    if (status === "authenticated") {
      setLoading(false);
    }
  }, [status, router]);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (status === "loading" || loading) {
    return (
      <div style={wrapperStyle}>
        <AdminSidebar />
        <div style={mainStyle}>
          <div style={loadingStyle}>Loading settings...</div>
        </div>
      </div>
    );
  }

  const sections = [
    { id: "general", label: "General", icon: "⚙️" },
    { id: "security", label: "Security", icon: "🔒" },
    { id: "transfers", label: "Transfers", icon: "💸" },
    { id: "notifications", label: "Notifications", icon: "🔔" },
    { id: "compliance", label: "Compliance", icon: "🛡️" },
  ];

  return (
    <div style={wrapperStyle}>
      <AdminSidebar />
      <div style={mainStyle}>
        <div style={headerStyle}>
          <div>
            <h1 style={titleStyle}>Admin Settings</h1>
            <p style={subtitleStyle}>Manage system configuration and preferences</p>
          </div>
          <button style={saveBtnStyle} onClick={handleSave}>
            {saved ? "Saved!" : "Save Changes"}
          </button>
        </div>

        {saved && (
          <div style={{ padding: "12px 16px", borderRadius: 8, marginBottom: 16, background: "#d4edda", color: "#155724", fontSize: 14 }}>
            Settings saved successfully.
          </div>
        )}

        <div style={{ display: "flex", gap: 24 }}>
          {/* Settings Sidebar */}
          <div style={settingsSidebarStyle}>
            {sections.map(s => (
              <button
                key={s.id}
                style={activeSection === s.id ? activeSectionBtnStyle : sectionBtnStyle}
                onClick={() => setActiveSection(s.id)}
              >
                <span>{s.icon}</span> {s.label}
              </button>
            ))}
          </div>

          {/* Settings Content */}
          <div style={settingsContentStyle}>
            {activeSection === "general" && (
              <>
                <h2 style={sectionTitleStyle}>General Settings</h2>
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>Bank Name</label>
                  <input style={inputStyle} value={settings.bankName} onChange={e => setSettings({...settings, bankName: e.target.value})} />
                </div>
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>Support Email</label>
                  <input style={inputStyle} value={settings.supportEmail} onChange={e => setSettings({...settings, supportEmail: e.target.value})} />
                </div>
                <div style={toggleGroupStyle}>
                  <div>
                    <div style={toggleLabelStyle}>Maintenance Mode</div>
                    <div style={toggleDescStyle}>Temporarily disable user access for system maintenance</div>
                  </div>
                  <button style={settings.maintenanceMode ? toggleOnStyle : toggleOffStyle} onClick={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})}>
                    {settings.maintenanceMode ? "ON" : "OFF"}
                  </button>
                </div>
                <div style={toggleGroupStyle}>
                  <div>
                    <div style={toggleLabelStyle}>Allow New Registrations</div>
                    <div style={toggleDescStyle}>Enable or disable new user sign-ups</div>
                  </div>
                  <button style={settings.newRegistrations ? toggleOnStyle : toggleOffStyle} onClick={() => setSettings({...settings, newRegistrations: !settings.newRegistrations})}>
                    {settings.newRegistrations ? "ON" : "OFF"}
                  </button>
                </div>
              </>
            )}

            {activeSection === "security" && (
              <>
                <h2 style={sectionTitleStyle}>Security Settings</h2>
                <div style={toggleGroupStyle}>
                  <div>
                    <div style={toggleLabelStyle}>Require Two-Factor Authentication</div>
                    <div style={toggleDescStyle}>Enforce 2FA for all user accounts</div>
                  </div>
                  <button style={settings.twoFactorRequired ? toggleOnStyle : toggleOffStyle} onClick={() => setSettings({...settings, twoFactorRequired: !settings.twoFactorRequired})}>
                    {settings.twoFactorRequired ? "ON" : "OFF"}
                  </button>
                </div>
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>Max Login Attempts</label>
                  <input style={inputStyle} type="number" value={settings.maxLoginAttempts} onChange={e => setSettings({...settings, maxLoginAttempts: parseInt(e.target.value)})} />
                </div>
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>Session Timeout (minutes)</label>
                  <input style={inputStyle} type="number" value={settings.sessionTimeout} onChange={e => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})} />
                </div>
              </>
            )}

            {activeSection === "transfers" && (
              <>
                <h2 style={sectionTitleStyle}>Transfer Settings</h2>
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>Minimum Transfer Amount ($)</label>
                  <input style={inputStyle} type="number" value={settings.minTransferAmount} onChange={e => setSettings({...settings, minTransferAmount: parseInt(e.target.value)})} />
                </div>
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>Maximum Transfer Amount ($)</label>
                  <input style={inputStyle} type="number" value={settings.maxTransferAmount} onChange={e => setSettings({...settings, maxTransferAmount: parseInt(e.target.value)})} />
                </div>
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>Maximum Daily Transfer Limit ($)</label>
                  <input style={inputStyle} type="number" value={settings.maxDailyTransfer} onChange={e => setSettings({...settings, maxDailyTransfer: parseInt(e.target.value)})} />
                </div>
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>Require Admin Approval Above ($)</label>
                  <input style={inputStyle} type="number" value={settings.requireApproval} onChange={e => setSettings({...settings, requireApproval: parseInt(e.target.value)})} />
                </div>
              </>
            )}

            {activeSection === "notifications" && (
              <>
                <h2 style={sectionTitleStyle}>Notification Settings</h2>
                {[
                  { key: "emailNotifications" as const, label: "Email Notifications", desc: "Send email alerts for important events" },
                  { key: "smsNotifications" as const, label: "SMS Notifications", desc: "Send SMS alerts for critical events" },
                  { key: "transactionAlerts" as const, label: "Transaction Alerts", desc: "Notify users of all transaction activity" },
                  { key: "loginAlerts" as const, label: "Login Alerts", desc: "Notify users of new login activity" },
                ].map(item => (
                  <div key={item.key} style={toggleGroupStyle}>
                    <div>
                      <div style={toggleLabelStyle}>{item.label}</div>
                      <div style={toggleDescStyle}>{item.desc}</div>
                    </div>
                    <button style={settings[item.key] ? toggleOnStyle : toggleOffStyle} onClick={() => setSettings({...settings, [item.key]: !settings[item.key]})}>
                      {settings[item.key] ? "ON" : "OFF"}
                    </button>
                  </div>
                ))}
              </>
            )}

            {activeSection === "compliance" && (
              <>
                <h2 style={sectionTitleStyle}>Compliance Settings</h2>
                <div style={toggleGroupStyle}>
                  <div>
                    <div style={toggleLabelStyle}>Require KYC Verification</div>
                    <div style={toggleDescStyle}>Mandate identity verification for all accounts</div>
                  </div>
                  <button style={settings.kycRequired ? toggleOnStyle : toggleOffStyle} onClick={() => setSettings({...settings, kycRequired: !settings.kycRequired})}>
                    {settings.kycRequired ? "ON" : "OFF"}
                  </button>
                </div>
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>KYC Expiry (days)</label>
                  <input style={inputStyle} type="number" value={settings.kycExpiryDays} onChange={e => setSettings({...settings, kycExpiryDays: parseInt(e.target.value)})} />
                </div>
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>AML Reporting Threshold ($)</label>
                  <input style={inputStyle} type="number" value={settings.amlThreshold} onChange={e => setSettings({...settings, amlThreshold: parseInt(e.target.value)})} />
                </div>
                <div style={toggleGroupStyle}>
                  <div>
                    <div style={toggleLabelStyle}>Sanctions List Check</div>
                    <div style={toggleDescStyle}>Automatically screen transactions against sanctions lists</div>
                  </div>
                  <button style={settings.sanctionsCheck ? toggleOnStyle : toggleOffStyle} onClick={() => setSettings({...settings, sanctionsCheck: !settings.sanctionsCheck})}>
                    {settings.sanctionsCheck ? "ON" : "OFF"}
                  </button>
                </div>
              </>
            )}
          </div>
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
const saveBtnStyle: React.CSSProperties = { padding: "10px 24px", border: "none", borderRadius: 8, background: "#28a745", color: "white", cursor: "pointer", fontSize: 14, fontWeight: 600 };
const settingsSidebarStyle: React.CSSProperties = { width: 220, display: "flex", flexDirection: "column", gap: 4, background: "white", borderRadius: 12, padding: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", height: "fit-content" };
const sectionBtnStyle: React.CSSProperties = { padding: "12px 16px", border: "none", borderRadius: 8, background: "transparent", cursor: "pointer", fontSize: 14, textAlign: "left", display: "flex", gap: 10, alignItems: "center", color: "#495057" };
const activeSectionBtnStyle: React.CSSProperties = { ...sectionBtnStyle, background: "#1a1f2e", color: "white" };
const settingsContentStyle: React.CSSProperties = { flex: 1, background: "white", borderRadius: 12, padding: 32, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" };
const sectionTitleStyle: React.CSSProperties = { fontSize: 18, fontWeight: 600, color: "#1a1f2e", marginBottom: 24, paddingBottom: 12, borderBottom: "1px solid #f0f0f0" };
const fieldGroupStyle: React.CSSProperties = { marginBottom: 20 };
const labelStyle: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 600, color: "#495057", marginBottom: 6 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 14px", border: "1px solid #dee2e6", borderRadius: 8, fontSize: 14, boxSizing: "border-box" };
const toggleGroupStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderBottom: "1px solid #f0f0f0" };
const toggleLabelStyle: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: "#333" };
const toggleDescStyle: React.CSSProperties = { fontSize: 13, color: "#6c757d", marginTop: 2 };
const toggleOnStyle: React.CSSProperties = { padding: "6px 16px", border: "none", borderRadius: 6, background: "#28a745", color: "white", cursor: "pointer", fontSize: 12, fontWeight: 600, minWidth: 50 };
const toggleOffStyle: React.CSSProperties = { padding: "6px 16px", border: "1px solid #dee2e6", borderRadius: 6, background: "#f8f9fa", color: "#6c757d", cursor: "pointer", fontSize: 12, fontWeight: 600, minWidth: 50 };
