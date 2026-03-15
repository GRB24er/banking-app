"use client";

import Link from "next/link";
import { useState } from "react";

export default function WealthAdvisoryPage() {
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
            Wealth Management
          </div>
          <h1 style={{ color: "white", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, marginBottom: 16 }}>Personalized Wealth Advisory</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 18, maxWidth: 600, margin: "0 auto" }}>
            Expert financial guidance tailored to your unique goals, risk tolerance, and life stage.
          </p>
        </div>
      </section>

      {/* Services */}
      <section style={{ padding: "80px 24px", maxWidth: 1280, margin: "0 auto" }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, textAlign: "center", marginBottom: 48, color: "#1a1f2e" }}>Our Advisory Services</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {[
            { icon: "🎯", title: "Goal-Based Planning", desc: "We design comprehensive financial strategies aligned with your specific life goals, from education funding to legacy planning." },
            { icon: "📊", title: "Portfolio Construction", desc: "Custom-built portfolios leveraging institutional-grade research across global markets, alternative investments, and fixed income." },
            { icon: "🛡️", title: "Risk Management", desc: "Sophisticated hedging strategies and diversification techniques to protect and preserve your wealth through market cycles." },
            { icon: "💎", title: "Tax Optimization", desc: "Strategic tax planning to minimize liabilities through tax-loss harvesting, asset location optimization, and charitable giving strategies." },
            { icon: "🏠", title: "Real Estate Advisory", desc: "Expert guidance on real estate investments, from direct property acquisitions to REITs and real estate private equity." },
            { icon: "🌍", title: "Global Allocation", desc: "Access to international markets and cross-border investment opportunities with currency risk management." },
          ].map((service, i) => (
            <div key={i} style={{ padding: 32, border: "1px solid rgba(26,31,46,0.08)", borderRadius: 16, transition: "box-shadow 0.3s" }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>{service.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "#1a1f2e", marginBottom: 8 }}>{service.title}</h3>
              <p style={{ fontSize: 14, color: "#5a6170", lineHeight: 1.7 }}>{service.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Process */}
      <section style={{ background: "#faf9f7", padding: "80px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, textAlign: "center", marginBottom: 48, color: "#1a1f2e" }}>How We Work</h2>
          {[
            { step: "01", title: "Discovery", desc: "We begin with an in-depth consultation to understand your financial situation, goals, and risk profile." },
            { step: "02", title: "Strategy Design", desc: "Our team crafts a personalized wealth strategy with clear milestones and actionable recommendations." },
            { step: "03", title: "Implementation", desc: "We execute the strategy across your accounts, coordinating with tax and legal advisors as needed." },
            { step: "04", title: "Ongoing Review", desc: "Regular portfolio reviews and strategy adjustments to keep you on track as your life evolves." },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 24, marginBottom: 32, alignItems: "flex-start" }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#c9a962", minWidth: 48 }}>{item.step}</div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: "#1a1f2e", marginBottom: 4 }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: "#5a6170", lineHeight: 1.7 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "linear-gradient(135deg, #1a1f2e, #252b3d)", padding: "60px 24px", textAlign: "center" }}>
        <h2 style={{ color: "white", fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Ready to Start Your Journey?</h2>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 16, marginBottom: 32 }}>Schedule a complimentary consultation with one of our senior advisors.</p>
        <Link href="/contact" style={{ display: "inline-block", background: "#c9a962", color: "#1a1f2e", padding: "14px 32px", borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: 15 }}>
          Book a Consultation
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
