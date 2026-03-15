"use client";

import Link from "next/link";
import { useState } from "react";

export default function TermsPage() {
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
          <h1 style={{ color: "white", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, marginBottom: 16 }}>Terms of Service</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 16 }}>Last updated: January 1, 2024</p>
        </div>
      </section>

      {/* Content */}
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "60px 24px 80px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          <section>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: "#1a1f2e" }}>1. Agreement to Terms</h2>
            <p style={{ color: "#5a6170", lineHeight: 1.8 }}>
              By accessing or using the services provided by Horizon Global Capital ("Company," "we," "us," or "our"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not access or use our services. These terms apply to all visitors, users, and clients of our banking and financial services platform.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: "#1a1f2e" }}>2. Eligibility</h2>
            <p style={{ color: "#5a6170", lineHeight: 1.8 }}>
              To use our services, you must be at least 18 years of age and possess the legal capacity to enter into a binding agreement. You must provide accurate, current, and complete information during registration and maintain the accuracy of such information. Accounts found to contain inaccurate information may be suspended or terminated.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: "#1a1f2e" }}>3. Account Services</h2>
            <p style={{ color: "#5a6170", lineHeight: 1.8, marginBottom: 12 }}>
              Horizon Global Capital offers a range of banking and financial services including but not limited to:
            </p>
            <ul style={{ color: "#5a6170", lineHeight: 2, paddingLeft: 24 }}>
              <li>Checking and savings accounts</li>
              <li>Investment portfolio management</li>
              <li>Wire transfers and electronic fund transfers</li>
              <li>Credit card services</li>
              <li>Loan and mortgage products</li>
              <li>Foreign exchange services</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: "#1a1f2e" }}>4. Fees and Charges</h2>
            <p style={{ color: "#5a6170", lineHeight: 1.8 }}>
              Certain services may be subject to fees, charges, and interest rates as outlined in our fee schedule. We reserve the right to modify our fee structure with 30 days prior notice. Clients are responsible for reviewing the current fee schedule and understanding applicable charges before initiating transactions.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: "#1a1f2e" }}>5. Security and Authentication</h2>
            <p style={{ color: "#5a6170", lineHeight: 1.8 }}>
              You are responsible for safeguarding your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use. We employ industry-standard security measures including 256-bit encryption, multi-factor authentication, and continuous fraud monitoring. However, no method of electronic transmission is completely secure.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: "#1a1f2e" }}>6. Transaction Processing</h2>
            <p style={{ color: "#5a6170", lineHeight: 1.8 }}>
              We process transactions in accordance with applicable banking regulations. Internal transfers are typically processed instantly. External transfers may take 1-3 business days. Wire transfers are subject to daily limits and may incur additional fees. We reserve the right to delay or refuse transactions that we believe may be fraudulent or in violation of applicable laws.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: "#1a1f2e" }}>7. Regulatory Compliance</h2>
            <p style={{ color: "#5a6170", lineHeight: 1.8 }}>
              Horizon Global Capital is authorised and regulated by the Financial Conduct Authority (FCA). We comply with all applicable anti-money laundering (AML), know-your-customer (KYC), and data protection regulations. We may request additional documentation to verify your identity or the source of funds at any time.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: "#1a1f2e" }}>8. Limitation of Liability</h2>
            <p style={{ color: "#5a6170", lineHeight: 1.8 }}>
              To the maximum extent permitted by law, Horizon Global Capital shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services. Our total liability shall not exceed the amount of fees paid by you in the twelve months preceding the claim. This limitation applies to all causes of action, whether in contract, tort, or otherwise.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: "#1a1f2e" }}>9. Account Termination</h2>
            <p style={{ color: "#5a6170", lineHeight: 1.8 }}>
              Either party may terminate the account relationship with 30 days written notice. We reserve the right to suspend or terminate accounts immediately if we suspect fraudulent activity, violation of these terms, or as required by law. Upon termination, any remaining balance will be returned to the account holder less any outstanding fees or obligations.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: "#1a1f2e" }}>10. Changes to Terms</h2>
            <p style={{ color: "#5a6170", lineHeight: 1.8 }}>
              We may update these terms from time to time. We will notify you of material changes via email or through our platform. Continued use of our services after such changes constitutes acceptance of the updated terms. We encourage you to review these terms periodically.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: "#1a1f2e" }}>11. Contact Information</h2>
            <p style={{ color: "#5a6170", lineHeight: 1.8 }}>
              For questions about these Terms of Service, please contact us at{" "}
              <a href="mailto:legal@horizonbank.com" style={{ color: "#c9a962", textDecoration: "none" }}>legal@horizonbank.com</a> or call us at 1-800-HORIZON.
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
              <Link href="/privacy" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: 13 }}>Privacy Policy</Link>
              <Link href="/terms" style={{ color: "#c9a962", textDecoration: "none", fontSize: 13 }}>Terms of Service</Link>
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
