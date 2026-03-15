"use client";

import Link from "next/link";
import { useState } from "react";

export default function FixedIncomePage() {
  const [scrolled, setScrolled] = useState(false);

  if (typeof window !== "undefined") {
    window.addEventListener("scroll", () => setScrolled(window.scrollY > 20));
  }

  return (
    <div style={{ minHeight: "100vh", background: "white", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif", color: "#1a1f2e", lineHeight: 1.6 }}>
      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: scrolled ? "rgba(255,255,255,0.95)" : "white", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(26,31,46,0.08)", transition: "all 0.3s ease" }}>
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

      {/* Hero */}
      <section style={{ background: "linear-gradient(135deg, #1a1f2e 0%, #252b3d 100%)", padding: "80px 24px 60px", textAlign: "center" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ display: "inline-block", background: "rgba(201,169,98,0.15)", color: "#c9a962", padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
            Capital Markets
          </div>
          <h1 style={{ color: "white", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, marginBottom: 16 }}>Fixed Income</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 18, maxWidth: 600, margin: "0 auto" }}>
            Build a stable income stream with our comprehensive fixed income solutions spanning government, corporate, and structured credit markets.
          </p>
        </div>
      </section>

      {/* Yield Snapshot */}
      <section style={{ background: "#faf9f7", padding: "40px 24px", borderBottom: "1px solid rgba(26,31,46,0.06)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <h3 style={{ textAlign: "center", fontSize: 14, color: "#6c757d", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 24 }}>Benchmark Yields</h3>
          <div style={{ display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
            {[
              { name: "US 2Y", yield: "4.32%", change: "-2bp" },
              { name: "US 10Y", yield: "4.15%", change: "+3bp" },
              { name: "US 30Y", yield: "4.38%", change: "+1bp" },
              { name: "DE 10Y", yield: "2.28%", change: "-1bp" },
              { name: "UK 10Y", yield: "3.95%", change: "+4bp" },
            ].map((item, i) => (
              <div key={i} style={{ textAlign: "center", minWidth: 120 }}>
                <div style={{ fontSize: 13, color: "#6c757d", marginBottom: 4 }}>{item.name}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#1a1f2e" }}>{item.yield}</div>
                <div style={{ fontSize: 12, color: item.change.startsWith("+") ? "#dc3545" : "#28a745", fontWeight: 600 }}>{item.change}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section style={{ padding: "80px 24px", maxWidth: 1280, margin: "0 auto" }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, textAlign: "center", marginBottom: 48, color: "#1a1f2e" }}>Fixed Income Products</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {[
            { icon: "🏛️", title: "Government Bonds", desc: "US Treasuries, sovereign debt, and agency securities offering the highest credit quality and liquidity." },
            { icon: "🏢", title: "Corporate Bonds", desc: "Investment-grade and high-yield corporate debt across sectors, maturities, and credit ratings." },
            { icon: "🏠", title: "Mortgage-Backed Securities", desc: "Agency and non-agency MBS providing exposure to the US residential and commercial mortgage markets." },
            { icon: "🌍", title: "Emerging Market Debt", desc: "Sovereign and corporate bonds from emerging economies offering higher yields with diversification benefits." },
            { icon: "🏦", title: "Municipal Bonds", desc: "Tax-exempt municipal securities for tax-efficient income generation, including general obligation and revenue bonds." },
            { icon: "📋", title: "Structured Credit", desc: "CLOs, ABS, and other structured products offering attractive risk-adjusted returns with diversified collateral pools." },
          ].map((product, i) => (
            <div key={i} style={{ padding: 32, border: "1px solid rgba(26,31,46,0.08)", borderRadius: 16 }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>{product.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "#1a1f2e", marginBottom: 8 }}>{product.title}</h3>
              <p style={{ fontSize: 14, color: "#5a6170", lineHeight: 1.7 }}>{product.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Strategy */}
      <section style={{ background: "#faf9f7", padding: "80px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, textAlign: "center", marginBottom: 48, color: "#1a1f2e" }}>Our Approach</h2>
          {[
            { title: "Credit Research", desc: "Rigorous bottom-up credit analysis combining quantitative models with fundamental research across issuers and sectors." },
            { title: "Duration Management", desc: "Active duration positioning based on macroeconomic outlook, yield curve analysis, and central bank policy expectations." },
            { title: "Portfolio Construction", desc: "Optimized portfolio construction balancing yield, credit quality, liquidity, and sector diversification." },
            { title: "Risk Management", desc: "Comprehensive risk monitoring including interest rate sensitivity, credit spread exposure, and liquidity analysis." },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 16, marginBottom: 24, alignItems: "flex-start" }}>
              <div style={{ color: "#c9a962", fontSize: 20, fontWeight: 700 }}>&#10003;</div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1a1f2e", marginBottom: 4 }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: "#5a6170", lineHeight: 1.7 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "linear-gradient(135deg, #1a1f2e, #252b3d)", padding: "60px 24px", textAlign: "center" }}>
        <h2 style={{ color: "white", fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Build Your Bond Portfolio</h2>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 16, marginBottom: 32 }}>Speak with our fixed income specialists about building a stable income portfolio.</p>
        <Link href="/contact" style={{ display: "inline-block", background: "#c9a962", color: "#1a1f2e", padding: "14px 32px", borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: 15 }}>
          Contact Our Team
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ background: "#1a1f2e", padding: "40px 24px 24px", color: "rgba(255,255,255,0.5)", fontSize: 13, textAlign: "center" }}>
        <div style={{ display: "flex", gap: 24, justifyContent: "center", marginBottom: 20 }}>
          <Link href="/about" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>About</Link>
          <Link href="/terms" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Terms</Link>
          <Link href="/privacy" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Privacy</Link>
          <Link href="/contact" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Contact</Link>
        </div>
        <p>&copy; {new Date().getFullYear()} Horizon Global Capital. All rights reserved.</p>
      </footer>
    </div>
  );
}
