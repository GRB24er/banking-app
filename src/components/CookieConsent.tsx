"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const COOKIE_CONSENT_KEY = "cookie-consent";

type ConsentValue = "accepted" | "rejected" | null;

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) {
      setVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem(
      COOKIE_CONSENT_KEY,
      JSON.stringify({
        essential: true,
        analytics: true,
        marketing: true,
        functional: true,
        timestamp: new Date().toISOString(),
      })
    );
    setVisible(false);
  };

  const handleRejectNonEssential = () => {
    localStorage.setItem(
      COOKIE_CONSENT_KEY,
      JSON.stringify({
        essential: true,
        analytics: false,
        marketing: false,
        functional: false,
        timestamp: new Date().toISOString(),
      })
    );
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "rgba(26, 31, 46, 0.97)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(201, 169, 98, 0.3)",
        padding: "20px 24px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: "1 1 500px", minWidth: 280 }}>
          <p
            style={{
              color: "#d1d5db",
              fontSize: 14,
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            We use cookies to enhance your banking experience and analyse site
            traffic. By continuing, you consent to our use of cookies in
            accordance with our Cookie Policy.
          </p>
          <Link
            href="/cookie-preferences"
            style={{
              color: "#c9a962",
              fontSize: 13,
              textDecoration: "underline",
              marginTop: 6,
              display: "inline-block",
            }}
          >
            Cookie Preferences
          </Link>
        </div>
        <div
          style={{
            display: "flex",
            gap: 12,
            flexShrink: 0,
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={handleRejectNonEssential}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "1px solid rgba(201, 169, 98, 0.4)",
              background: "transparent",
              color: "#c9a962",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(201, 169, 98, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            Reject Non-Essential
          </button>
          <button
            onClick={handleAcceptAll}
            style={{
              padding: "10px 24px",
              borderRadius: 8,
              border: "none",
              background: "linear-gradient(135deg, #c9a962, #b8943f)",
              color: "#1a1f2e",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                "linear-gradient(135deg, #d4b872, #c9a962)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                "linear-gradient(135deg, #c9a962, #b8943f)";
            }}
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
