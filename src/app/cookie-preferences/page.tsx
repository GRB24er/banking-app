"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const COOKIE_CONSENT_KEY = "cookie-consent";

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  timestamp: string;
}

const defaultPreferences: CookiePreferences = {
  essential: true,
  analytics: false,
  marketing: false,
  functional: false,
  timestamp: "",
};

const categories = [
  {
    key: "essential" as const,
    label: "Essential Cookies",
    description:
      "Required for the website to function properly. These cookies enable core features such as security, session management, and accessibility. They cannot be disabled.",
    alwaysOn: true,
  },
  {
    key: "analytics" as const,
    label: "Analytics Cookies",
    description:
      "Help us understand how visitors interact with our website by collecting and reporting information anonymously. This data allows us to improve our services and user experience.",
    alwaysOn: false,
  },
  {
    key: "marketing" as const,
    label: "Marketing Cookies",
    description:
      "Used to track visitors across websites to display relevant advertisements. These cookies help us measure the effectiveness of our marketing campaigns.",
    alwaysOn: false,
  },
  {
    key: "functional" as const,
    label: "Functional Cookies",
    description:
      "Enable enhanced functionality and personalisation, such as remembering your preferences, language settings, and customised layouts.",
    alwaysOn: false,
  },
];

export default function CookiePreferencesPage() {
  const [preferences, setPreferences] =
    useState<CookiePreferences>(defaultPreferences);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPreferences({ ...defaultPreferences, ...parsed });
      } catch {
        // ignore invalid data
      }
    }
  }, []);

  const handleToggle = (key: keyof CookiePreferences) => {
    if (key === "essential" || key === "timestamp") return;
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem(
      COOKIE_CONSENT_KEY,
      JSON.stringify({
        ...preferences,
        timestamp: new Date().toISOString(),
      })
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0f1219 0%, #1a1f2e 100%)",
        fontFamily: "Inter, sans-serif",
        color: "#e5e7eb",
      }}
    >
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "60px 24px 80px",
        }}
      >
        <Link
          href="/"
          style={{
            color: "#c9a962",
            fontSize: 14,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 32,
          }}
        >
          &larr; Back to Home
        </Link>

        <h1
          style={{
            fontFamily: "Playfair Display, serif",
            fontSize: 32,
            fontWeight: 600,
            color: "#ffffff",
            marginBottom: 8,
          }}
        >
          Cookie Preferences
        </h1>
        <p
          style={{
            color: "#9ca3af",
            fontSize: 15,
            lineHeight: 1.7,
            marginBottom: 40,
          }}
        >
          Manage your cookie settings below. Essential cookies are always
          enabled as they are necessary for the website to function. You can
          choose to enable or disable other categories of cookies.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {categories.map((cat) => (
            <div
              key={cat.key}
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: 12,
                padding: "24px 28px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: "#ffffff",
                    margin: 0,
                  }}
                >
                  {cat.label}
                </h3>
                {cat.alwaysOn ? (
                  <span
                    style={{
                      fontSize: 12,
                      color: "#c9a962",
                      fontWeight: 500,
                      background: "rgba(201, 169, 98, 0.12)",
                      padding: "4px 12px",
                      borderRadius: 20,
                    }}
                  >
                    Always On
                  </span>
                ) : (
                  <button
                    onClick={() => handleToggle(cat.key)}
                    style={{
                      width: 48,
                      height: 26,
                      borderRadius: 13,
                      border: "none",
                      cursor: "pointer",
                      position: "relative",
                      transition: "background 0.2s",
                      background: preferences[cat.key]
                        ? "#c9a962"
                        : "rgba(255, 255, 255, 0.15)",
                    }}
                    aria-label={`Toggle ${cat.label}`}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: 3,
                        left: preferences[cat.key] ? 25 : 3,
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: "#ffffff",
                        transition: "left 0.2s",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                      }}
                    />
                  </button>
                )}
              </div>
              <p
                style={{
                  color: "#9ca3af",
                  fontSize: 14,
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {cat.description}
              </p>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 32,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <button
            onClick={handleSave}
            style={{
              padding: "12px 32px",
              borderRadius: 8,
              border: "none",
              background: "linear-gradient(135deg, #c9a962, #b8943f)",
              color: "#1a1f2e",
              fontSize: 15,
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
            Save Preferences
          </button>
          {saved && (
            <span
              style={{
                color: "#4ade80",
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              Preferences saved successfully
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
