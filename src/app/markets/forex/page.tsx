"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForexPage() {
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
          <h1 style={{ color: "white", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, marginBottom: 16 }}>Foreign Exchange</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 18, maxWidth: 600, margin: "0 auto" }}>
            Access global currency markets with institutional-grade execution, competitive spreads, and comprehensive risk management tools.
          </p>
        </div>
      </section>

      {/* Live Rates Placeholder */}
      <section style={{ background: "#faf9f7", padding: "40px 24px", borderBottom: "1px solid rgba(26,31,46,0.06)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <h3 style={{ textAlign: "center", fontSize: 14, color: "#6c757d", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 24 }}>Indicative Rates</h3>
          <div style={{ display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
            {[
              { pair: "EUR/USD", rate: "1.0847", change: "+0.12%" },
              { pair: "GBP/USD", rate: "1.2634", change: "-0.08%" },
              { pair: "USD/JPY", rate: "148.52", change: "+0.24%" },
              { pair: "USD/CHF", rate: "0.8823", change: "-0.15%" },
              { pair: "AUD/USD", rate: "0.6542", change: "+0.06%" },
            ].map((item, i) => (
              <div key={i} style={{ textAlign: "center", minWidth: 120 }}>
                <div style={{ fontSize: 13, color: "#6c757d", marginBottom: 4 }}>{item.pair}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#1a1f2e" }}>{item.rate}</div>
                <div style={{ fontSize: 12, color: item.change.startsWith("+") ? "#28a745" : "#dc3545", fontWeight: 600 }}>{item.change}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section style={{ padding: "80px 24px", maxWidth: 1280, margin: "0 auto" }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, textAlign: "center", marginBottom: 48, color: "#1a1f2e" }}>FX Solutions</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {[
            { icon: "💱", title: "Spot Trading", desc: "Execute currency transactions at current market rates with tight spreads across 100+ currency pairs." },
            { icon: "📅", title: "Forward Contracts", desc: "Lock in exchange rates for future transactions to hedge against currency fluctuations and protect margins." },
            { icon: "⚡", title: "FX Options", desc: "Flexible hedging strategies using vanilla and structured options to manage currency risk with defined costs." },
            { icon: "🔄", title: "Currency Swaps", desc: "Swap principal and interest payments in different currencies to optimize funding costs and manage exposure." },
            { icon: "🏢", title: "Corporate FX", desc: "Tailored foreign exchange solutions for businesses with international operations, supply chains, and revenues." },
            { icon: "📊", title: "FX Research", desc: "Daily market commentary, technical analysis, and strategic research from our experienced FX analysts." },
          ].map((service, i) => (
            <div key={i} style={{ padding: 32, border: "1px solid rgba(26,31,46,0.08)", borderRadius: 16 }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>{service.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "#1a1f2e", marginBottom: 8 }}>{service.title}</h3>
              <p style={{ fontSize: 14, color: "#5a6170", lineHeight: 1.7 }}>{service.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Us */}
      <section style={{ background: "#faf9f7", padding: "80px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, textAlign: "center", marginBottom: 48, color: "#1a1f2e" }}>Why Trade FX With Us</h2>
          {[
            { title: "Institutional Liquidity", desc: "Deep liquidity pools sourced from tier-1 banks and ECN providers for best-in-class execution." },
            { title: "Competitive Pricing", desc: "Tight spreads starting from 0.1 pips on major pairs with transparent, all-in pricing." },
            { title: "Advanced Technology", desc: "Low-latency execution platform with algorithmic trading capabilities and API connectivity." },
            { title: "Expert Support", desc: "24/5 FX desk staffed by experienced dealers available for trade execution and market guidance." },
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
        <h2 style={{ color: "white", fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Start Trading Forex</h2>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 16, marginBottom: 32 }}>Open an FX trading account and access global currency markets today.</p>
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
