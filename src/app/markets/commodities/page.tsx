"use client";

import Link from "next/link";
import { useState } from "react";

export default function CommoditiesPage() {
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
          <h1 style={{ color: "white", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, marginBottom: 16 }}>Commodities</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 18, maxWidth: 600, margin: "0 auto" }}>
            Diversify your portfolio with exposure to precious metals, energy, agriculture, and industrial commodities.
          </p>
        </div>
      </section>

      {/* Market Prices */}
      <section style={{ background: "#faf9f7", padding: "40px 24px", borderBottom: "1px solid rgba(26,31,46,0.06)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <h3 style={{ textAlign: "center", fontSize: 14, color: "#6c757d", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 24 }}>Market Snapshot</h3>
          <div style={{ display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
            {[
              { name: "Gold", price: "$2,024.50", change: "+0.85%" },
              { name: "Silver", price: "$22.68", change: "+1.12%" },
              { name: "Crude Oil", price: "$78.34", change: "-0.45%" },
              { name: "Natural Gas", price: "$2.89", change: "+2.30%" },
              { name: "Copper", price: "$3.82", change: "+0.67%" },
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

      {/* Sectors */}
      <section style={{ padding: "80px 24px", maxWidth: 1280, margin: "0 auto" }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, textAlign: "center", marginBottom: 48, color: "#1a1f2e" }}>Commodity Sectors</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {[
            { icon: "🥇", title: "Precious Metals", desc: "Gold, silver, platinum, and palladium. A traditional safe haven for portfolio diversification and inflation hedging." },
            { icon: "⛽", title: "Energy", desc: "Crude oil, natural gas, and refined products. Access global energy markets for trading and hedging purposes." },
            { icon: "🌾", title: "Agriculture", desc: "Grains, softs, and livestock. Trade agricultural commodities with exposure to global food supply dynamics." },
            { icon: "🏗️", title: "Industrial Metals", desc: "Copper, aluminum, zinc, and nickel. Gain exposure to metals critical for global infrastructure and manufacturing." },
            { icon: "💎", title: "Precious Stones", desc: "Structured investment vehicles providing exposure to the global precious stones and rare materials market." },
            { icon: "🌊", title: "Carbon Credits", desc: "Environmental commodity trading including carbon credits and renewable energy certificates for ESG-focused portfolios." },
          ].map((sector, i) => (
            <div key={i} style={{ padding: 32, border: "1px solid rgba(26,31,46,0.08)", borderRadius: 16 }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>{sector.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "#1a1f2e", marginBottom: 8 }}>{sector.title}</h3>
              <p style={{ fontSize: 14, color: "#5a6170", lineHeight: 1.7 }}>{sector.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How to Invest */}
      <section style={{ background: "#faf9f7", padding: "80px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, textAlign: "center", marginBottom: 48, color: "#1a1f2e" }}>Investment Vehicles</h2>
          {[
            { title: "Physical Holdings", desc: "Allocated and unallocated physical metal accounts with secure vaulting in London, Zurich, and New York." },
            { title: "Futures & Options", desc: "Exchange-traded derivatives on major commodity exchanges for speculative and hedging strategies." },
            { title: "Commodity ETFs", desc: "Low-cost exposure through exchange-traded funds tracking commodity indices and individual commodities." },
            { title: "Structured Products", desc: "Custom-designed structured notes and certificates offering tailored commodity market exposure." },
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
        <h2 style={{ color: "white", fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Explore Commodities</h2>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 16, marginBottom: 32 }}>Add real assets to your portfolio. Speak with our commodities specialist today.</p>
        <Link href="/contact" style={{ display: "inline-block", background: "#c9a962", color: "#1a1f2e", padding: "14px 32px", borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: 15 }}>
          Get Started
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
