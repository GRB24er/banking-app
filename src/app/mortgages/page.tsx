"use client";

import Link from "next/link";

export default function MortgagesPage() {
  return (
    <div style={{ minHeight: "100vh", background: "white", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif", color: "#1a1f2e", lineHeight: 1.6 }}>
      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "white", borderBottom: "1px solid rgba(26,31,46,0.08)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 72 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
            <img src="/images/Logo.png" alt="Horizon Global Capital" style={{ height: 40 }} />
          </Link>
          <nav style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <Link href="/about" style={{ color: "#5a6170", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>About</Link>
            <Link href="/contact" style={{ color: "#5a6170", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Contact</Link>
            <Link href="/auth/signin" style={{ background: "#1a1f2e", color: "white", padding: "8px 20px", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Client Portal</Link>
          </nav>
        </div>
      </header>

      {/* Coming Soon Content */}
      <main style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 72px - 160px)", padding: "60px 24px" }}>
        <div style={{ textAlign: "center", maxWidth: 560 }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, rgba(201,169,98,0.15) 0%, rgba(201,169,98,0.05) 100%)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 36 }}>
            🏠
          </div>
          <h1 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 700, marginBottom: 16 }}>Mortgage Services Coming Soon</h1>
          <p style={{ color: "#5a6170", fontSize: 16, lineHeight: 1.8, marginBottom: 32 }}>
            We are expanding our property finance offerings to better serve your needs.
            Our team is preparing competitive mortgage products with preferential rates
            for Horizon Global Capital clients.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/contact" style={{ background: "linear-gradient(135deg, #c9a962 0%, #a8935f 100%)", color: "#1a1f2e", padding: "14px 28px", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 15 }}>
              Contact Us for Details
            </Link>
            <Link href="/" style={{ border: "1px solid rgba(26,31,46,0.15)", color: "#1a1f2e", padding: "14px 28px", borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: 15 }}>
              Back to Home
            </Link>
          </div>

          <div style={{ marginTop: 48, padding: "20px 24px", background: "#faf9f7", borderRadius: 12, border: "1px solid rgba(26,31,46,0.06)" }}>
            <p style={{ fontSize: 14, color: "#5a6170" }}>
              Interested in being notified when mortgage services launch? Contact our Private Banking team at{" "}
              <a href="mailto:mortgages@horizonbank.com" style={{ color: "#c9a962", textDecoration: "none", fontWeight: 600 }}>mortgages@horizonbank.com</a>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ background: "#1a1f2e", padding: "48px 24px 32px", color: "rgba(255,255,255,0.5)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
            <div>
              <img src="/images/Logo.png" alt="Horizon Global Capital" style={{ height: 32, marginBottom: 12 }} />
              <p style={{ fontSize: 13 }}>European Private Banking Excellence Since 1897</p>
            </div>
            <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
              <Link href="/privacy" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: 13 }}>Privacy Policy</Link>
              <Link href="/terms" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: 13 }}>Terms of Service</Link>
              <Link href="/contact" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: 13 }}>Contact</Link>
              <Link href="/about" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: 13 }}>About</Link>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 24, textAlign: "center", fontSize: 12 }}>
            <p>&copy; 2024 Horizon Global Capital. All rights reserved. Authorised and regulated by the Financial Conduct Authority.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
