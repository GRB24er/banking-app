"use client";

import Link from "next/link";
import { useState } from "react";

export default function PrivacyPage() {
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
          <h1 style={{ color: "white", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, marginBottom: 16 }}>Privacy Policy</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 16 }}>Last updated: January 1, 2024</p>
        </div>
      </section>

      {/* Content */}
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "60px 24px 80px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          <section>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: "#1a1f2e" }}>1. Information We Collect</h2>
            <p style={{ color: "#5a6170", lineHeight: 1.8, marginBottom: 12 }}>
              Horizon Global Capital collects information necessary to provide our banking and financial services. This includes:
            </p>
            <ul style={{ color: "#5a6170", lineHeight: 2, paddingLeft: 24 }}>
              <li><strong>Personal Information:</strong> Name, date of birth, address, phone number, email address, and government-issued identification numbers.</li>
              <li><strong>Financial Information:</strong> Account balances, transaction history, income details, and credit information.</li>
              <li><strong>Technical Data:</strong> IP address, device information, browser type, and usage patterns on our platform.</li>
              <li><strong>Communications:</strong> Records of correspondence with our support team and customer service interactions.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: "#1a1f2e" }}>2. How We Use Your Information</h2>
            <p style={{ color: "#5a6170", lineHeight: 1.8, marginBottom: 12 }}>
              We use the information we collect to:
            </p>
            <ul style={{ color: "#5a6170", lineHeight: 2, paddingLeft: 24 }}>
              <li>Provide, maintain, and improve our banking services</li>
              <li>Process transactions and send related notifications</li>
              <li>Verify your identity and comply with regulatory requirements</li>
              <li>Detect and prevent fraud, unauthorized access, and other illegal activities</li>
              <li>Communicate with you about products, services, and account updates</li>
              <li>Analyse usage patterns to improve our platform and user experience</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: "#1a1f2e" }}>3. Data Protection and Security</h2>
            <p style={{ color: "#5a6170", lineHeight: 1.8 }}>
              We employ industry-leading security measures to protect your personal and financial information. This includes 256-bit SSL/TLS encryption for all data in transit, AES-256 encryption for data at rest, multi-factor authentication, regular security audits, and 24/7 fraud monitoring systems. Our infrastructure is SOC 2 Type II compliant and undergoes regular penetration testing.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: "#1a1f2e" }}>4. Information Sharing</h2>
            <p style={{ color: "#5a6170", lineHeight: 1.8, marginBottom: 12 }}>
              We do not sell your personal information. We may share your information with:
            </p>
            <ul style={{ color: "#5a6170", lineHeight: 2, paddingLeft: 24 }}>
              <li><strong>Service Providers:</strong> Third-party companies that help us provide our services (payment processors, identity verification services).</li>
              <li><strong>Regulatory Bodies:</strong> Government agencies and regulators as required by law (FCA, HMRC, anti-money laundering authorities).</li>
              <li><strong>Business Partners:</strong> With your explicit consent, for co-branded or affiliated products.</li>
              <li><strong>Legal Requirements:</strong> When required by law, subpoena, court order, or government regulation.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: "#1a1f2e" }}>5. Your Rights</h2>
            <p style={{ color: "#5a6170", lineHeight: 1.8, marginBottom: 12 }}>
              Under applicable data protection laws, including the UK GDPR, you have the right to:
            </p>
            <ul style={{ color: "#5a6170", lineHeight: 2, paddingLeft: 24 }}>
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate or incomplete data</li>
              <li>Request deletion of your personal data (subject to legal obligations)</li>
              <li>Object to or restrict certain processing activities</li>
              <li>Request data portability in a structured, machine-readable format</li>
              <li>Withdraw consent at any time where processing is based on consent</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: "#1a1f2e" }}>6. Cookies and Tracking</h2>
            <p style={{ color: "#5a6170", lineHeight: 1.8 }}>
              We use cookies and similar tracking technologies to enhance your browsing experience, analyse site traffic, and personalise content. You can manage your cookie preferences through your browser settings. Essential cookies required for the operation of our platform cannot be disabled. For detailed information, please refer to our Cookie Policy.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: "#1a1f2e" }}>7. Data Retention</h2>
            <p style={{ color: "#5a6170", lineHeight: 1.8 }}>
              We retain your personal data for as long as necessary to fulfil the purposes outlined in this policy and to comply with legal obligations. Financial records are retained for a minimum of 7 years as required by regulatory requirements. After the retention period, data is securely deleted or anonymised.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: "#1a1f2e" }}>8. International Data Transfers</h2>
            <p style={{ color: "#5a6170", lineHeight: 1.8 }}>
              As a global institution, we may transfer your data to jurisdictions outside of the United Kingdom and European Economic Area. Such transfers are safeguarded by Standard Contractual Clauses, adequacy decisions, or other approved transfer mechanisms to ensure an equivalent level of data protection.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: "#1a1f2e" }}>9. Contact Us</h2>
            <p style={{ color: "#5a6170", lineHeight: 1.8 }}>
              For questions about this Privacy Policy or to exercise your data rights, please contact our Data Protection Officer at{" "}
              <a href="mailto:privacy@horizonbank.com" style={{ color: "#c9a962", textDecoration: "none" }}>privacy@horizonbank.com</a> or write to us at Horizon Global Capital, Data Protection Office, 1 Aldwych, London, WC2B 4BZ.
            </p>
          </section>
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
              <Link href="/privacy" style={{ color: "#c9a962", textDecoration: "none", fontSize: 13 }}>Privacy Policy</Link>
              <Link href="/terms" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: 13 }}>Terms of Service</Link>
              <Link href="/contact" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: 13 }}>Contact</Link>
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
