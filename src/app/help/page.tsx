"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export default function HelpPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const faqs: FAQItem[] = [
    { question: "How do I transfer money between my accounts?", answer: "Navigate to Transfers > Internal Transfer from the sidebar. Select the source and destination accounts, enter the amount, and confirm. Internal transfers are processed instantly.", category: "transfers" },
    { question: "How do I send a wire transfer?", answer: "Go to Transfers > Wire Transfer. Enter the recipient's bank details including routing number and account number, specify the amount, and submit. Domestic wires are typically processed within 1 business day.", category: "transfers" },
    { question: "How do I send an international transfer?", answer: "Navigate to Transfers > International. You'll need the recipient's SWIFT/BIC code, IBAN or account number, and bank details. International transfers may take 2-5 business days.", category: "transfers" },
    { question: "How do I view my account statements?", answer: "Click on Statements in the sidebar to access your monthly and quarterly account statements. You can download them as PDF files for your records.", category: "accounts" },
    { question: "How do I apply for a credit card?", answer: "Go to Cards > Apply for Card in the sidebar. Choose from our available card tiers, fill out the application form, and submit. You'll receive a decision within 1-2 business days.", category: "cards" },
    { question: "How do I request a virtual card?", answer: "Navigate to Cards > Virtual Cards. Click 'Request New Card', select the card type, set your spending limits, and submit. Virtual cards are typically approved within 24 hours.", category: "cards" },
    { question: "How do I apply for a loan?", answer: "Click on Loans in the sidebar to view available loan products. Select the loan type, enter the desired amount and term, and submit your application. Our team will review it within 2-3 business days.", category: "loans" },
    { question: "How do I buy or sell cryptocurrency?", answer: "Navigate to Crypto > Buy / Convert from the sidebar. Select the cryptocurrency, choose buy or sell, enter the amount, and confirm. Transactions are processed in real-time.", category: "crypto" },
    { question: "How do I enable two-factor authentication?", answer: "Go to Settings > Security. Toggle on Two-Factor Authentication and follow the setup wizard. We support authenticator apps and SMS verification.", category: "security" },
    { question: "What should I do if I suspect unauthorized activity?", answer: "Immediately contact our support team through the chat feature or call our 24/7 security hotline. You can also freeze your account temporarily from Settings > Security.", category: "security" },
    { question: "How do I update my personal information?", answer: "Navigate to your Profile page by clicking your avatar in the header. You can update your name, address, phone number, and other personal details.", category: "accounts" },
    { question: "What are the transfer limits?", answer: "Default limits are $100,000 per transaction and $500,000 per day. Limits may vary based on your account type and verification level. Contact support to request higher limits.", category: "transfers" },
    { question: "How do I pay my bills?", answer: "Click on Bills in the sidebar. You can add payees, schedule one-time or recurring payments, and manage all your bill payments from one place.", category: "accounts" },
    { question: "How long do deposits take to process?", answer: "Direct deposits are available same-day. Check deposits via mobile take 1-2 business days. Wire transfers are typically available within 24 hours.", category: "accounts" },
  ];

  const categories = [
    { id: "all", label: "All Topics", icon: "📚" },
    { id: "accounts", label: "Accounts", icon: "🏦" },
    { id: "transfers", label: "Transfers", icon: "💸" },
    { id: "cards", label: "Cards", icon: "💳" },
    { id: "loans", label: "Loans", icon: "💰" },
    { id: "crypto", label: "Crypto", icon: "₿" },
    { id: "security", label: "Security", icon: "🔒" },
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
    const matchesSearch = !searchQuery || faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (status === "loading") {
    return (
      <div style={wrapperStyle}>
        <Sidebar />
        <div style={mainStyle}>
          <Header />
          <div style={loadingStyle}>Loading help center...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={wrapperStyle}>
      <Sidebar />
      <div style={mainStyle}>
        <Header />
        <div style={contentStyle}>
          {/* Hero Section */}
          <div style={heroStyle}>
            <h1 style={heroTitleStyle}>How can we help you?</h1>
            <p style={heroSubtitleStyle}>Search our knowledge base or browse topics below</p>
            <div style={searchWrapperStyle}>
              <input
                type="text"
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={searchInputStyle}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div style={quickActionsStyle}>
            {[
              { icon: "💬", title: "Live Chat", desc: "Chat with support", href: "/support" },
              { icon: "📞", title: "Call Us", desc: "1-800-HORIZON", href: "#" },
              { icon: "📧", title: "Email", desc: "support@horizonbank.com", href: "#" },
              { icon: "🏢", title: "Visit Branch", desc: "Find nearest branch", href: "/contact" },
            ].map((action, i) => (
              <div key={i} style={quickActionCardStyle} onClick={() => action.href !== "#" && router.push(action.href)}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{action.icon}</div>
                <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 600, color: "#1a1f2e" }}>{action.title}</h3>
                <p style={{ margin: 0, fontSize: 13, color: "#6c757d" }}>{action.desc}</p>
              </div>
            ))}
          </div>

          {/* Category Tabs */}
          <div style={categoryTabsStyle}>
            {categories.map(cat => (
              <button
                key={cat.id}
                style={activeCategory === cat.id ? activeCatStyle : catBtnStyle}
                onClick={() => setActiveCategory(cat.id)}
              >
                <span>{cat.icon}</span> {cat.label}
              </button>
            ))}
          </div>

          {/* FAQ List */}
          <div style={faqListStyle}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1a1f2e", marginBottom: 16 }}>
              Frequently Asked Questions
              <span style={{ fontSize: 13, fontWeight: 400, color: "#6c757d", marginLeft: 8 }}>({filteredFAQs.length} results)</span>
            </h2>

            {filteredFAQs.length === 0 ? (
              <div style={emptyStyle}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                <h3 style={{ color: "#333", marginBottom: 8 }}>No results found</h3>
                <p style={{ color: "#6c757d", fontSize: 14 }}>Try a different search term or browse by category.</p>
              </div>
            ) : (
              filteredFAQs.map((faq, i) => (
                <div key={i} style={faqItemStyle}>
                  <button
                    style={faqQuestionStyle}
                    onClick={() => setExpandedFAQ(expandedFAQ === i ? null : i)}
                  >
                    <span style={{ flex: 1, textAlign: "left" }}>{faq.question}</span>
                    <span style={{ fontSize: 18, color: "#6c757d", transition: "transform 0.2s", transform: expandedFAQ === i ? "rotate(45deg)" : "none" }}>+</span>
                  </button>
                  {expandedFAQ === i && (
                    <div style={faqAnswerStyle}>
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Contact CTA */}
          <div style={ctaStyle}>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 600, color: "white" }}>Still need help?</h3>
            <p style={{ margin: "0 0 20px", fontSize: 14, color: "rgba(255,255,255,0.7)" }}>Our support team is available 24/7 to assist you.</p>
            <button style={ctaBtnStyle} onClick={() => router.push("/support")}>Contact Support</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const wrapperStyle: React.CSSProperties = { display: "flex", minHeight: "100vh", background: "#f0f2f5" };
const mainStyle: React.CSSProperties = { flex: 1, display: "flex", flexDirection: "column", marginLeft: 280, minWidth: 0 };
const contentStyle: React.CSSProperties = { padding: "24px 32px", flex: 1 };
const loadingStyle: React.CSSProperties = { display: "flex", justifyContent: "center", alignItems: "center", height: "60vh", fontSize: 18, color: "#6c757d" };
const heroStyle: React.CSSProperties = { background: "linear-gradient(135deg, #1a1f2e, #2d3548)", borderRadius: 16, padding: "48px 32px", textAlign: "center", marginBottom: 24 };
const heroTitleStyle: React.CSSProperties = { fontSize: 28, fontWeight: 700, color: "white", margin: "0 0 8px" };
const heroSubtitleStyle: React.CSSProperties = { fontSize: 15, color: "rgba(255,255,255,0.6)", margin: "0 0 24px" };
const searchWrapperStyle: React.CSSProperties = { maxWidth: 500, margin: "0 auto" };
const searchInputStyle: React.CSSProperties = { width: "100%", padding: "14px 20px", border: "none", borderRadius: 12, fontSize: 15, boxSizing: "border-box", outline: "none" };
const quickActionsStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 };
const quickActionCardStyle: React.CSSProperties = { background: "white", padding: "24px 20px", borderRadius: 12, textAlign: "center", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", transition: "box-shadow 0.2s" };
const categoryTabsStyle: React.CSSProperties = { display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" };
const catBtnStyle: React.CSSProperties = { padding: "8px 16px", border: "1px solid #dee2e6", borderRadius: 8, background: "white", cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#495057", display: "flex", gap: 6, alignItems: "center" };
const activeCatStyle: React.CSSProperties = { ...catBtnStyle, background: "#1a1f2e", color: "white", borderColor: "#1a1f2e" };
const faqListStyle: React.CSSProperties = { marginBottom: 32 };
const emptyStyle: React.CSSProperties = { textAlign: "center", padding: "40px 20px" };
const faqItemStyle: React.CSSProperties = { background: "white", borderRadius: 8, marginBottom: 4, overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" };
const faqQuestionStyle: React.CSSProperties = { width: "100%", padding: "16px 20px", border: "none", background: "white", cursor: "pointer", fontSize: 14, fontWeight: 500, color: "#1a1f2e", display: "flex", justifyContent: "space-between", alignItems: "center" };
const faqAnswerStyle: React.CSSProperties = { padding: "0 20px 16px", fontSize: 14, color: "#555", lineHeight: 1.6, borderTop: "1px solid #f0f0f0", paddingTop: 12 };
const ctaStyle: React.CSSProperties = { background: "linear-gradient(135deg, #1a1f2e, #2d3548)", borderRadius: 16, padding: "40px 32px", textAlign: "center" };
const ctaBtnStyle: React.CSSProperties = { padding: "12px 32px", border: "2px solid #c9a962", borderRadius: 8, background: "transparent", color: "#c9a962", cursor: "pointer", fontSize: 14, fontWeight: 600 };
