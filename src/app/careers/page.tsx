"use client";

import Link from "next/link";
import { useState } from "react";

export default function CareersPage() {
  const [scrolled, setScrolled] = useState(false);

  if (typeof window !== "undefined") {
    window.addEventListener("scroll", () => setScrolled(window.scrollY > 20));
  }

  const openings = [
    { title: "Senior Portfolio Manager", department: "Wealth Management", location: "London", type: "Full-time" },
    { title: "Cybersecurity Analyst", department: "Information Security", location: "London", type: "Full-time" },
    { title: "Private Banking Advisor", department: "Private Banking", location: "Zurich", type: "Full-time" },
    { title: "Full Stack Developer", department: "Technology", location: "London / Remote", type: "Full-time" },
    { title: "Compliance Officer", department: "Legal & Compliance", location: "London", type: "Full-time" },
    { title: "Quantitative Analyst", department: "Research", location: "New York", type: "Full-time" },
    { title: "Client Relationship Manager", department: "Private Banking", location: "Hong Kong", type: "Full-time" },
    { title: "UX/UI Designer", department: "Technology", location: "London / Remote", type: "Full-time" },
  ];

  const benefits = [
    { icon: "💰", title: "Competitive Compensation", desc: "Industry-leading salaries with performance-based bonuses." },
    { icon: "🏥", title: "Health & Wellbeing", desc: "Comprehensive health, dental, and vision coverage for you and your family." },
    { icon: "📚", title: "Learning & Development", desc: "Annual education allowance and access to world-class training programmes." },
    { icon: "🌴", title: "Generous Leave", desc: "25 days annual leave plus bank holidays and flexible working arrangements." },
    { icon: "🏦", title: "Financial Benefits", desc: "Pension contributions, employee banking perks, and share purchase plans." },
    { icon: "🌍", title: "Global Mobility", desc: "Opportunities to work across our offices in London, Zurich, New York, and Hong Kong." },
  ];

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
            Join Our Team
          </div>
          <h1 style={{ color: "white", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, marginBottom: 16 }}>Careers at Horizon Global Capital</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 18, maxWidth: 600, margin: "0 auto" }}>
            Build your career at one of the world&apos;s most respected private banking institutions.
          </p>
        </div>
      </section>

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
        {/* Why Join Us */}
        <section style={{ padding: "80px 0" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Why Horizon Global Capital?</h2>
            <p style={{ color: "#5a6170", maxWidth: 600, margin: "0 auto", fontSize: 16 }}>
              We invest in our people as much as we invest for our clients. Join a culture of excellence, innovation, and integrity.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
            {benefits.map((benefit, i) => (
              <div key={i} style={{ background: "#faf9f7", borderRadius: 12, padding: 28 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{benefit.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{benefit.title}</h3>
                <p style={{ color: "#5a6170", fontSize: 14, lineHeight: 1.7 }}>{benefit.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Open Positions */}
        <section style={{ padding: "0 0 80px" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Open Positions</h2>
            <p style={{ color: "#5a6170", fontSize: 16 }}>{openings.length} roles currently available across our global offices</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {openings.map((job, i) => (
              <div key={i} style={{ background: "#faf9f7", borderRadius: 12, padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, border: "1px solid rgba(26,31,46,0.04)" }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{job.title}</h3>
                  <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#5a6170" }}>
                    <span>{job.department}</span>
                    <span>|</span>
                    <span>{job.location}</span>
                    <span>|</span>
                    <span>{job.type}</span>
                  </div>
                </div>
                <button style={{ background: "#1a1f2e", color: "white", padding: "10px 24px", borderRadius: 8, border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                  Apply Now
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: "0 0 80px", textAlign: "center" }}>
          <div style={{ background: "linear-gradient(135deg, #1a1f2e 0%, #252b3d 100%)", borderRadius: 16, padding: "60px 40px" }}>
            <h2 style={{ color: "white", fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Don&apos;t see the right role?</h2>
            <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: 32, maxWidth: 500, margin: "0 auto 32px" }}>
              We are always looking for exceptional talent. Send us your CV and we will keep you in mind for future opportunities.
            </p>
            <a href="mailto:careers@horizonbank.com" style={{ display: "inline-block", background: "linear-gradient(135deg, #c9a962 0%, #a8935f 100%)", color: "#1a1f2e", padding: "14px 32px", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 15 }}>
              Send Your CV
            </a>
          </div>
        </section>
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
              <Link href="/careers" style={{ color: "#c9a962", textDecoration: "none", fontSize: 13 }}>Careers</Link>
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
