"use client";

import Link from "next/link";
import { useState } from "react";

export default function AboutPage() {
  const [scrolled, setScrolled] = useState(false);

  if (typeof window !== "undefined") {
    window.addEventListener("scroll", () => setScrolled(window.scrollY > 20));
  }

  const milestones = [
    { year: "1897", title: "Founded in London", desc: "Established as a private merchant bank serving European industrialists and entrepreneurs." },
    { year: "1945", title: "Post-War Expansion", desc: "Expanded operations across continental Europe, financing reconstruction and growth." },
    { year: "1982", title: "Global Presence", desc: "Opened offices in New York, Hong Kong, and Zurich, becoming a truly global institution." },
    { year: "2005", title: "Digital Transformation", desc: "Launched our first digital banking platform, pioneering online private banking services." },
    { year: "2020", title: "Next-Generation Banking", desc: "Introduced AI-powered wealth management and real-time global transaction capabilities." },
  ];

  const leadership = [
    { name: "Sir Edward Blackwell", role: "Chairman", desc: "40 years in international finance with expertise in wealth preservation strategies." },
    { name: "Dr. Helena Strauss", role: "Chief Executive Officer", desc: "Former ECB advisor with deep expertise in monetary policy and institutional banking." },
    { name: "James Chen", role: "Chief Investment Officer", desc: "Award-winning portfolio manager with a track record of consistent risk-adjusted returns." },
    { name: "Catherine Moreau", role: "Chief Technology Officer", desc: "Technology visionary leading our digital transformation and cybersecurity initiatives." },
  ];

  const values = [
    { icon: "🛡️", title: "Trust", desc: "Built over more than a century of unwavering commitment to our clients." },
    { icon: "🎯", title: "Precision", desc: "Meticulous attention to detail in every financial strategy we craft." },
    { icon: "🌍", title: "Global Reach", desc: "Local expertise backed by a worldwide network spanning 180+ countries." },
    { icon: "🤝", title: "Discretion", desc: "Absolute confidentiality in all client relationships and transactions." },
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
            <Link href="/about" style={{ color: "#c9a962", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>About</Link>
            <Link href="/contact" style={{ color: "#5a6170", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Contact</Link>
            <Link href="/auth/signin" style={{ background: "#1a1f2e", color: "white", padding: "8px 20px", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Client Portal</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section style={{ background: "linear-gradient(135deg, #1a1f2e 0%, #252b3d 100%)", padding: "80px 24px 60px", textAlign: "center" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ display: "inline-block", background: "rgba(201,169,98,0.15)", color: "#c9a962", padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
            Established 1897
          </div>
          <h1 style={{ color: "white", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, marginBottom: 16 }}>About Horizon Global Capital</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 18, maxWidth: 600, margin: "0 auto" }}>
            A legacy of financial excellence, serving distinguished clients across the globe for over a century.
          </p>
        </div>
      </section>

      {/* Stats Bar */}
      <section style={{ background: "#faf9f7", padding: "40px 24px", borderBottom: "1px solid rgba(26,31,46,0.06)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", justifyContent: "center", gap: 60, flexWrap: "wrap" }}>
          {[
            { value: "$48B+", label: "Assets Under Management" },
            { value: "180+", label: "Countries Served" },
            { value: "127", label: "Years of Excellence" },
            { value: "12,000+", label: "Private Clients" },
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#c9a962", marginBottom: 4 }}>{stat.value}</div>
              <div style={{ fontSize: 13, color: "#5a6170" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
        {/* Our Story */}
        <section style={{ padding: "80px 0" }}>
          <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Our Story</h2>
            <p style={{ color: "#5a6170", fontSize: 16, lineHeight: 1.8 }}>
              Founded in 1897 in the heart of London, Horizon Global Capital has grown from a private merchant bank into one of the world&apos;s most respected financial institutions. For over a century, we have provided bespoke banking solutions to discerning individuals, families, and institutions who demand nothing less than excellence.
            </p>
          </div>

          {/* Values */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24, marginBottom: 80 }}>
            {values.map((value, i) => (
              <div key={i} style={{ background: "#faf9f7", borderRadius: 12, padding: 32, textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>{value.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{value.title}</h3>
                <p style={{ color: "#5a6170", fontSize: 14, lineHeight: 1.7 }}>{value.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Timeline */}
        <section style={{ padding: "0 0 80px" }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, textAlign: "center", marginBottom: 48 }}>Our Journey</h2>
          <div style={{ maxWidth: 700, margin: "0 auto", display: "flex", flexDirection: "column", gap: 32 }}>
            {milestones.map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
                <div style={{ minWidth: 80, fontWeight: 700, fontSize: 18, color: "#c9a962", paddingTop: 2 }}>{m.year}</div>
                <div style={{ borderLeft: "2px solid rgba(201,169,98,0.3)", paddingLeft: 24, paddingBottom: 8 }}>
                  <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{m.title}</h3>
                  <p style={{ color: "#5a6170", fontSize: 14, lineHeight: 1.7 }}>{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Leadership */}
        <section style={{ padding: "0 0 80px" }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, textAlign: "center", marginBottom: 48 }}>Leadership Team</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
            {leadership.map((person, i) => (
              <div key={i} style={{ background: "#faf9f7", borderRadius: 12, padding: 32 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #c9a962 0%, #a8935f 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
                  {person.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{person.name}</h3>
                <div style={{ color: "#c9a962", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{person.role}</div>
                <p style={{ color: "#5a6170", fontSize: 14, lineHeight: 1.7 }}>{person.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: "0 0 80px", textAlign: "center" }}>
          <div style={{ background: "linear-gradient(135deg, #1a1f2e 0%, #252b3d 100%)", borderRadius: 16, padding: "60px 40px" }}>
            <h2 style={{ color: "white", fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Ready to Experience Elite Banking?</h2>
            <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: 32, maxWidth: 500, margin: "0 auto 32px" }}>Join a select group of clients who demand excellence.</p>
            <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/auth/signup" style={{ background: "linear-gradient(135deg, #c9a962 0%, #a8935f 100%)", color: "#1a1f2e", padding: "14px 32px", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 15 }}>
                Apply for Membership
              </Link>
              <Link href="/contact" style={{ border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "14px 32px", borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: 15 }}>
                Schedule Consultation
              </Link>
            </div>
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
              <Link href="/about" style={{ color: "#c9a962", textDecoration: "none", fontSize: 13 }}>About</Link>
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
