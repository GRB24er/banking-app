"use client";

import Link from "next/link";
import { useState } from "react";

export default function ContactPage() {
  const [scrolled, setScrolled] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  if (typeof window !== "undefined") {
    window.addEventListener("scroll", () => setScrolled(window.scrollY > 20));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const contactMethods = [
    { icon: "📞", title: "Phone Support", value: "1-800-HORIZON", subtitle: "Available 24/7", href: "tel:1800HORIZON" },
    { icon: "📧", title: "Email", value: "support@horizonbank.com", subtitle: "Response within 24 hours", href: "mailto:support@horizonbank.com" },
    { icon: "💬", title: "Live Chat", value: "Chat with us now", subtitle: "Available 24/7", href: "/support" },
    { icon: "📍", title: "Head Office", value: "1 Aldwych, London", subtitle: "WC2B 4BZ, United Kingdom", href: "/locations" },
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
            <Link href="/contact" style={{ color: "#c9a962", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Contact</Link>
            <Link href="/auth/signin" style={{ background: "#1a1f2e", color: "white", padding: "8px 20px", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Client Portal</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section style={{ background: "linear-gradient(135deg, #1a1f2e 0%, #252b3d 100%)", padding: "80px 24px 60px", textAlign: "center" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h1 style={{ color: "white", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, marginBottom: 16 }}>Contact Us</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 18, maxWidth: 600, margin: "0 auto" }}>
            Our dedicated team is ready to assist you with your banking and financial needs.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section style={{ background: "#faf9f7", padding: "48px 24px", borderBottom: "1px solid rgba(26,31,46,0.06)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
          {contactMethods.map((method, i) => (
            <a key={i} href={method.href} style={{ background: "white", borderRadius: 12, padding: 28, textDecoration: "none", color: "inherit", border: "1px solid rgba(26,31,46,0.06)", transition: "box-shadow 0.2s", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{method.icon}</div>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{method.title}</h3>
              <div style={{ fontSize: 15, color: "#c9a962", fontWeight: 600, marginBottom: 4 }}>{method.value}</div>
              <div style={{ fontSize: 13, color: "#8a8f9c" }}>{method.subtitle}</div>
            </a>
          ))}
        </div>
      </section>

      {/* Form Section */}
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "start" }}>
          {/* Form */}
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Send Us a Message</h2>
            <p style={{ color: "#5a6170", marginBottom: 32, fontSize: 15 }}>
              Fill out the form below and a member of our team will get back to you within one business day.
            </p>

            {submitted ? (
              <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12, padding: 40, textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Message Sent</h3>
                <p style={{ color: "#5a6170" }}>Thank you for reaching out. Our team will respond within one business day.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#5a6170" }}>Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      style={{ width: "100%", padding: "12px 16px", borderRadius: 8, border: "1px solid rgba(26,31,46,0.12)", fontSize: 14, outline: "none", background: "#faf9f7" }}
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#5a6170" }}>Email Address</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{ width: "100%", padding: "12px 16px", borderRadius: 8, border: "1px solid rgba(26,31,46,0.12)", fontSize: 14, outline: "none", background: "#faf9f7" }}
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#5a6170" }}>Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      style={{ width: "100%", padding: "12px 16px", borderRadius: 8, border: "1px solid rgba(26,31,46,0.12)", fontSize: 14, outline: "none", background: "#faf9f7" }}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#5a6170" }}>Subject</label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      style={{ width: "100%", padding: "12px 16px", borderRadius: 8, border: "1px solid rgba(26,31,46,0.12)", fontSize: 14, outline: "none", background: "#faf9f7" }}
                    >
                      <option value="">Select a subject</option>
                      <option value="general">General Inquiry</option>
                      <option value="accounts">Account Services</option>
                      <option value="wealth">Wealth Management</option>
                      <option value="private">Private Banking</option>
                      <option value="support">Technical Support</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#5a6170" }}>Message</label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    style={{ width: "100%", padding: "12px 16px", borderRadius: 8, border: "1px solid rgba(26,31,46,0.12)", fontSize: 14, outline: "none", resize: "vertical", background: "#faf9f7", fontFamily: "inherit" }}
                    placeholder="How can we help you?"
                  />
                </div>
                <button
                  type="submit"
                  style={{ background: "linear-gradient(135deg, #c9a962 0%, #a8935f 100%)", color: "#1a1f2e", padding: "14px 32px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 15, cursor: "pointer", alignSelf: "flex-start" }}
                >
                  Send Message
                </button>
              </form>
            )}
          </div>

          {/* Info Panel */}
          <div>
            <div style={{ background: "#faf9f7", borderRadius: 12, padding: 32, marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Office Hours</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                  <span style={{ color: "#5a6170" }}>Monday - Friday</span>
                  <span style={{ fontWeight: 600 }}>8:00 AM - 8:00 PM GMT</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                  <span style={{ color: "#5a6170" }}>Saturday</span>
                  <span style={{ fontWeight: 600 }}>9:00 AM - 5:00 PM GMT</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                  <span style={{ color: "#5a6170" }}>Sunday</span>
                  <span style={{ fontWeight: 600 }}>Closed</span>
                </div>
              </div>
              <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(201,169,98,0.08)", borderRadius: 8, fontSize: 13, color: "#5a6170" }}>
                Phone and live chat support is available 24/7 for emergency banking matters.
              </div>
            </div>

            <div style={{ background: "#faf9f7", borderRadius: 12, padding: 32, marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Head Office</h3>
              <p style={{ color: "#5a6170", fontSize: 14, lineHeight: 1.8 }}>
                Horizon Global Capital<br />
                1 Aldwych<br />
                London, WC2B 4BZ<br />
                United Kingdom
              </p>
            </div>

            <div style={{ background: "#faf9f7", borderRadius: 12, padding: 32 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Private Client Services</h3>
              <p style={{ color: "#5a6170", fontSize: 14, lineHeight: 1.8, marginBottom: 16 }}>
                For clients with assets exceeding $1M, our dedicated private banking team offers personalised concierge services.
              </p>
              <a href="tel:1800HORIZON" style={{ color: "#c9a962", textDecoration: "none", fontWeight: 600, fontSize: 14 }}>
                Call 1-800-HORIZON for Priority Access
              </a>
            </div>
          </div>
        </div>
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
              <Link href="/contact" style={{ color: "#c9a962", textDecoration: "none", fontSize: 13 }}>Contact</Link>
              <Link href="/about" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: 13 }}>About</Link>
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
