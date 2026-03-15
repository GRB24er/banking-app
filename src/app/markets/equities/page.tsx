"use client";

import Link from "next/link";
import { useState } from "react";

export default function EquitiesPage() {
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
          <h1 style={{ color: "white", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, marginBottom: 16 }}>Equities</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 18, maxWidth: 600, margin: "0 auto" }}>
            Access global equity markets with institutional research, best execution, and comprehensive portfolio management.
          </p>
        </div>
      </section>

      {/* Index Snapshot */}
      <section style={{ background: "#faf9f7", padding: "40px 24px", borderBottom: "1px solid rgba(26,31,46,0.06)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <h3 style={{ textAlign: "center", fontSize: 14, color: "#6c757d", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 24 }}>Market Indices</h3>
          <div style={{ display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
            {[
              { name: "S&P 500", price: "4,890.97", change: "+0.52%" },
              { name: "NASDAQ", price: "15,628.04", change: "+0.83%" },
              { name: "FTSE 100", price: "7,694.20", change: "-0.18%" },
              { name: "DAX", price: "16,921.47", change: "+0.35%" },
              { name: "Nikkei 225", price: "36,158.02", change: "+1.15%" },
            ].map((item, i) => (
              <div key={i} style={{ textAlign: "center", minWidth: 120 }}>
                <div style={{ fontSize: 13, color: "#6c757d", marginBottom: 4 }}>{item.name}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#1a1f2e" }}>{item.price}</div>
                <div style={{ fontSize: 12, color: item.change.startsWith("+") ? "#28a745" : "#dc3545", fontWeight: 600 }}>{item.change}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section style={{ padding: "80px 24px", maxWidth: 1280, margin: "0 auto" }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, textAlign: "center", marginBottom: 48, color: "#1a1f2e" }}>Equity Solutions</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {[
            { icon: "📈", title: "Direct Equity Trading", desc: "Execute trades across major global exchanges with competitive commissions and best-in-class order routing." },
            { icon: "🔍", title: "Equity Research", desc: "Proprietary fundamental and quantitative research covering 2,000+ companies across developed and emerging markets." },
            { icon: "💼", title: "Portfolio Management", desc: "Discretionary and advisory portfolio management with strategies tailored to your risk profile and objectives." },
            { icon: "🎯", title: "IPO Access", desc: "Priority allocation to initial public offerings and secondary placements through our extensive investment banking network." },
            { icon: "🌐", title: "International Equities", desc: "Seamless access to 40+ international markets with local market expertise and multi-currency settlement." },
            { icon: "📊", title: "Quantitative Strategies", desc: "Systematic equity strategies including factor investing, statistical arbitrage, and algorithmic execution services." },
          ].map((service, i) => (
            <div key={i} style={{ padding: 32, border: "1px solid rgba(26,31,46,0.08)", borderRadius: 16 }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>{service.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "#1a1f2e", marginBottom: 8 }}>{service.title}</h3>
              <p style={{ fontSize: 14, color: "#5a6170", lineHeight: 1.7 }}>{service.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Investment Approach */}
      <section style={{ background: "#faf9f7", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, textAlign: "center", marginBottom: 48, color: "#1a1f2e" }}>Investment Strategies</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            {[
              { title: "Growth", desc: "Focus on companies with above-average earnings growth potential, innovative business models, and expanding market share.", color: "#28a745" },
              { title: "Value", desc: "Identify undervalued securities trading below intrinsic value with catalysts for price appreciation and margin improvement.", color: "#007bff" },
              { title: "Income", desc: "High-quality dividend-paying equities with sustainable yields, strong cash flows, and a history of dividend growth.", color: "#c9a962" },
              { title: "ESG", desc: "Environmentally and socially responsible investments that integrate ESG criteria without compromising financial returns.", color: "#6f42c1" },
            ].map((strategy, i) => (
              <div key={i} style={{ background: "white", padding: 28, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", borderTop: `3px solid ${strategy.color}` }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: "#1a1f2e", marginBottom: 8 }}>{strategy.title}</h3>
                <p style={{ fontSize: 14, color: "#5a6170", lineHeight: 1.7 }}>{strategy.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "linear-gradient(135deg, #1a1f2e, #252b3d)", padding: "60px 24px", textAlign: "center" }}>
        <h2 style={{ color: "white", fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Start Investing in Equities</h2>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 16, marginBottom: 32 }}>Open a brokerage account and access global equity markets today.</p>
        <Link href="/auth/signin" style={{ display: "inline-block", background: "#c9a962", color: "#1a1f2e", padding: "14px 32px", borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: 15 }}>
          Open an Account
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
