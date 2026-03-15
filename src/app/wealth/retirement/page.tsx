"use client";

import Link from "next/link";
import { useState } from "react";

export default function RetirementPlanningPage() {
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
            Retirement Planning
          </div>
          <h1 style={{ color: "white", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, marginBottom: 16 }}>Secure Your Future</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 18, maxWidth: 600, margin: "0 auto" }}>
            Comprehensive retirement planning strategies designed to ensure financial independence and peace of mind.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: "#faf9f7", padding: "40px 24px", borderBottom: "1px solid rgba(26,31,46,0.06)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", justifyContent: "center", gap: 60, flexWrap: "wrap" }}>
          {[
            { value: "$12B+", label: "Retirement Assets Managed" },
            { value: "5,400+", label: "Retirement Plans" },
            { value: "98%", label: "Client Satisfaction" },
            { value: "25+", label: "Years Experience" },
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#c9a962", marginBottom: 4 }}>{stat.value}</div>
              <div style={{ fontSize: 13, color: "#5a6170" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section style={{ padding: "80px 24px", maxWidth: 1280, margin: "0 auto" }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, textAlign: "center", marginBottom: 48, color: "#1a1f2e" }}>Retirement Solutions</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {[
            { icon: "📈", title: "401(k) & IRA Management", desc: "Expert management of traditional and Roth retirement accounts with optimized asset allocation strategies." },
            { icon: "🏖️", title: "Retirement Income Planning", desc: "Structured withdrawal strategies to ensure sustainable income throughout your retirement years." },
            { icon: "💊", title: "Healthcare Planning", desc: "Medicare optimization, long-term care insurance analysis, and healthcare cost projections." },
            { icon: "🏠", title: "Social Security Optimization", desc: "Strategic timing analysis to maximize your Social Security benefits over your lifetime." },
            { icon: "📋", title: "Estate Integration", desc: "Coordinated retirement and estate planning to protect your legacy and minimize tax burden." },
            { icon: "🔄", title: "Pension Analysis", desc: "Lump sum vs. annuity analysis, pension maximization strategies, and rollover guidance." },
          ].map((service, i) => (
            <div key={i} style={{ padding: 32, border: "1px solid rgba(26,31,46,0.08)", borderRadius: 16 }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>{service.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "#1a1f2e", marginBottom: 8 }}>{service.title}</h3>
              <p style={{ fontSize: 14, color: "#5a6170", lineHeight: 1.7 }}>{service.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section style={{ background: "#faf9f7", padding: "80px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, textAlign: "center", marginBottom: 48, color: "#1a1f2e" }}>Planning by Life Stage</h2>
          {[
            { age: "30s", title: "Foundation Building", desc: "Maximize employer match contributions, establish emergency funds, and begin aggressive growth investing." },
            { age: "40s", title: "Acceleration Phase", desc: "Increase savings rate, diversify investments, and begin catch-up contributions where eligible." },
            { age: "50s", title: "Pre-Retirement", desc: "Fine-tune asset allocation, maximize catch-up contributions, and develop detailed retirement income plans." },
            { age: "60+", title: "Retirement Transition", desc: "Implement withdrawal strategies, optimize Social Security timing, and coordinate healthcare coverage." },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 24, marginBottom: 32, alignItems: "flex-start" }}>
              <div style={{ background: "#1a1f2e", color: "#c9a962", padding: "8px 16px", borderRadius: 8, fontWeight: 700, fontSize: 16, minWidth: 48, textAlign: "center" }}>{item.age}</div>
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
        <h2 style={{ color: "white", fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Plan Your Retirement Today</h2>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 16, marginBottom: 32 }}>Get a complimentary retirement readiness assessment from our certified planners.</p>
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
