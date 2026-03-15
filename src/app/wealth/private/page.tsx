"use client";

import Link from "next/link";
import { useState } from "react";

export default function PrivateBankingPage() {
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
            Exclusive Services
          </div>
          <h1 style={{ color: "white", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, marginBottom: 16 }}>Private Banking</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 18, maxWidth: 600, margin: "0 auto" }}>
            An elevated banking experience reserved for our most distinguished clients, with dedicated relationship management and bespoke financial solutions.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: "#faf9f7", padding: "40px 24px", borderBottom: "1px solid rgba(26,31,46,0.06)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", justifyContent: "center", gap: 60, flexWrap: "wrap" }}>
          {[
            { value: "$1M+", label: "Minimum Relationship" },
            { value: "24/7", label: "Dedicated Support" },
            { value: "1:25", label: "Advisor-to-Client Ratio" },
            { value: "180+", label: "Countries Served" },
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#c9a962", marginBottom: 4 }}>{stat.value}</div>
              <div style={{ fontSize: 13, color: "#5a6170" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section style={{ padding: "80px 24px", maxWidth: 1280, margin: "0 auto" }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, textAlign: "center", marginBottom: 48, color: "#1a1f2e" }}>Private Banking Benefits</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {[
            { icon: "👤", title: "Dedicated Relationship Manager", desc: "A single point of contact who understands your complete financial picture and coordinates all services on your behalf." },
            { icon: "💎", title: "Preferential Rates", desc: "Exclusive pricing on loans, mortgages, and deposits. Reduced fees across all banking products and services." },
            { icon: "🌍", title: "Global Access", desc: "Seamless international banking with multi-currency accounts, foreign exchange services, and cross-border transaction support." },
            { icon: "🏠", title: "Bespoke Lending", desc: "Customized credit solutions including jumbo mortgages, securities-backed lending, and specialized business financing." },
            { icon: "📊", title: "Investment Access", desc: "Priority access to IPOs, private placements, hedge funds, and alternative investment opportunities." },
            { icon: "🎭", title: "Lifestyle Services", desc: "Concierge services, exclusive event invitations, art advisory, and curated experiences for you and your family." },
          ].map((benefit, i) => (
            <div key={i} style={{ padding: 32, border: "1px solid rgba(26,31,46,0.08)", borderRadius: 16 }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>{benefit.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "#1a1f2e", marginBottom: 8 }}>{benefit.title}</h3>
              <p style={{ fontSize: 14, color: "#5a6170", lineHeight: 1.7 }}>{benefit.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tiers */}
      <section style={{ background: "#faf9f7", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, textAlign: "center", marginBottom: 48, color: "#1a1f2e" }}>Membership Tiers</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            {[
              { tier: "Gold", min: "$1M+", features: ["Dedicated relationship manager", "Preferential deposit rates", "Fee-free wire transfers", "Priority customer support"] },
              { tier: "Platinum", min: "$5M+", features: ["Everything in Gold", "Private investment access", "Complimentary safe deposit", "Global concierge service", "Tax advisory sessions"] },
              { tier: "Black", min: "$25M+", features: ["Everything in Platinum", "Family office services", "Bespoke lending terms", "Art & real estate advisory", "Exclusive event access", "Dedicated legal referrals"] },
            ].map((tier, i) => (
              <div key={i} style={{ background: "white", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <div style={{ background: i === 2 ? "#1a1f2e" : i === 1 ? "#2d3548" : "#f8f9fa", padding: "24px 28px", textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: i >= 1 ? "white" : "#1a1f2e" }}>{tier.tier}</div>
                  <div style={{ fontSize: 14, color: i >= 1 ? "#c9a962" : "#c9a962", fontWeight: 600, marginTop: 4 }}>{tier.min}</div>
                </div>
                <div style={{ padding: "24px 28px" }}>
                  {tier.features.map((f, j) => (
                    <div key={j} style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 0", fontSize: 14, color: "#5a6170" }}>
                      <span style={{ color: "#c9a962" }}>&#10003;</span> {f}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "linear-gradient(135deg, #1a1f2e, #252b3d)", padding: "60px 24px", textAlign: "center" }}>
        <h2 style={{ color: "white", fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Experience Private Banking</h2>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 16, marginBottom: 32 }}>Discover a banking relationship that is as unique as you are.</p>
        <Link href="/contact" style={{ display: "inline-block", background: "#c9a962", color: "#1a1f2e", padding: "14px 32px", borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: 15 }}>
          Apply for Private Banking
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
