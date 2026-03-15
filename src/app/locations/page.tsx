"use client";

import Link from "next/link";
import { useState } from "react";

export default function LocationsPage() {
  const [scrolled, setScrolled] = useState(false);

  if (typeof window !== "undefined") {
    window.addEventListener("scroll", () => setScrolled(window.scrollY > 20));
  }

  const offices = [
    {
      city: "London",
      country: "United Kingdom",
      type: "Global Headquarters",
      address: "1 Aldwych, London, WC2B 4BZ",
      phone: "+44 20 7946 0958",
      hours: "Mon-Fri: 8:00 AM - 8:00 PM GMT",
      services: ["Private Banking", "Wealth Management", "Corporate Finance", "Investment Advisory"],
      featured: true,
    },
    {
      city: "Zurich",
      country: "Switzerland",
      type: "European Office",
      address: "Bahnhofstrasse 45, 8001 Zurich",
      phone: "+41 44 368 1200",
      hours: "Mon-Fri: 8:30 AM - 6:00 PM CET",
      services: ["Private Banking", "Asset Management", "Trust Services"],
      featured: false,
    },
    {
      city: "New York",
      country: "United States",
      type: "Americas Office",
      address: "375 Park Avenue, Suite 3200, New York, NY 10152",
      phone: "+1 (212) 555-0180",
      hours: "Mon-Fri: 8:00 AM - 7:00 PM EST",
      services: ["Investment Banking", "Wealth Management", "Private Credit"],
      featured: false,
    },
    {
      city: "Hong Kong",
      country: "China",
      type: "Asia-Pacific Office",
      address: "Two International Finance Centre, 8 Finance Street, Central",
      phone: "+852 3150 8800",
      hours: "Mon-Fri: 9:00 AM - 6:00 PM HKT",
      services: ["Private Banking", "Cross-Border Solutions", "Foreign Exchange"],
      featured: false,
    },
    {
      city: "Singapore",
      country: "Singapore",
      type: "Southeast Asia Office",
      address: "One Raffles Quay, North Tower, Level 35",
      phone: "+65 6823 4500",
      hours: "Mon-Fri: 9:00 AM - 6:00 PM SGT",
      services: ["Wealth Management", "Family Office Services"],
      featured: false,
    },
    {
      city: "Dubai",
      country: "United Arab Emirates",
      type: "Middle East Office",
      address: "Gate Village, DIFC, Building 3, Level 5",
      phone: "+971 4 425 0800",
      hours: "Sun-Thu: 8:00 AM - 5:00 PM GST",
      services: ["Private Banking", "Islamic Finance", "Cross-Border Solutions"],
      featured: false,
    },
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
            Global Presence
          </div>
          <h1 style={{ color: "white", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, marginBottom: 16 }}>Our Locations</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 18, maxWidth: 600, margin: "0 auto" }}>
            Serving clients across the globe from our strategically positioned offices in major financial centres.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: "#faf9f7", padding: "40px 24px", borderBottom: "1px solid rgba(26,31,46,0.06)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", justifyContent: "center", gap: 60, flexWrap: "wrap" }}>
          {[
            { value: "6", label: "Global Offices" },
            { value: "180+", label: "Countries Served" },
            { value: "24/7", label: "Client Support" },
            { value: "4", label: "Continents" },
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#c9a962", marginBottom: 4 }}>{stat.value}</div>
              <div style={{ fontSize: 13, color: "#5a6170" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 24 }}>
          {offices.map((office, i) => (
            <div key={i} style={{ background: "#faf9f7", borderRadius: 12, padding: 32, border: office.featured ? "2px solid rgba(201,169,98,0.3)" : "1px solid rgba(26,31,46,0.04)", position: "relative" }}>
              {office.featured && (
                <div style={{ position: "absolute", top: 16, right: 16, background: "linear-gradient(135deg, #c9a962 0%, #a8935f 100%)", color: "#1a1f2e", padding: "4px 12px", borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                  HEADQUARTERS
                </div>
              )}
              <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 2 }}>{office.city}</h3>
              <div style={{ color: "#5a6170", fontSize: 14, marginBottom: 4 }}>{office.country}</div>
              <div style={{ color: "#c9a962", fontSize: 13, fontWeight: 600, marginBottom: 20 }}>{office.type}</div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                <div style={{ display: "flex", gap: 10, fontSize: 14 }}>
                  <span style={{ color: "#8a8f9c", minWidth: 20 }}>📍</span>
                  <span style={{ color: "#5a6170" }}>{office.address}</span>
                </div>
                <div style={{ display: "flex", gap: 10, fontSize: 14 }}>
                  <span style={{ color: "#8a8f9c", minWidth: 20 }}>📞</span>
                  <a href={`tel:${office.phone.replace(/\s/g, "")}`} style={{ color: "#5a6170", textDecoration: "none" }}>{office.phone}</a>
                </div>
                <div style={{ display: "flex", gap: 10, fontSize: 14 }}>
                  <span style={{ color: "#8a8f9c", minWidth: 20 }}>🕐</span>
                  <span style={{ color: "#5a6170" }}>{office.hours}</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#8a8f9c", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Services</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {office.services.map((service, j) => (
                    <span key={j} style={{ background: "rgba(26,31,46,0.04)", padding: "4px 10px", borderRadius: 6, fontSize: 12, color: "#5a6170" }}>
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <section style={{ padding: "80px 0 0", textAlign: "center" }}>
          <div style={{ background: "linear-gradient(135deg, #1a1f2e 0%, #252b3d 100%)", borderRadius: 16, padding: "60px 40px" }}>
            <h2 style={{ color: "white", fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Visit Us</h2>
            <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: 32, maxWidth: 500, margin: "0 auto 32px" }}>
              Schedule a visit to any of our global offices for a private consultation with our banking advisors.
            </p>
            <Link href="/contact" style={{ display: "inline-block", background: "linear-gradient(135deg, #c9a962 0%, #a8935f 100%)", color: "#1a1f2e", padding: "14px 32px", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 15 }}>
              Schedule an Appointment
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ background: "#1a1f2e", padding: "48px 24px 32px", color: "rgba(255,255,255,0.5)", marginTop: 80 }}>
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
              <Link href="/locations" style={{ color: "#c9a962", textDecoration: "none", fontSize: 13 }}>Locations</Link>
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
