"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "40px",
        fontFamily: "Inter, sans-serif",
        color: "#fff",
        background: "#0D0F14",
      }}
    >
      <div
        style={{
          background: "#161820",
          border: "1px solid #1E2130",
          borderRadius: "16px",
          padding: "40px",
          maxWidth: "500px",
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
        <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "8px" }}>
          Something went wrong
        </h2>
        <p
          style={{
            fontSize: "14px",
            color: "#6B7084",
            marginBottom: "24px",
            lineHeight: 1.6,
          }}
        >
          An error occurred while loading the dashboard. Please try again.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button
            onClick={reset}
            style={{
              padding: "10px 24px",
              background: "linear-gradient(135deg, #C9A962, #A8935F)",
              border: "none",
              borderRadius: "10px",
              color: "#0D0F14",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "10px 24px",
              background: "transparent",
              border: "1px solid #1E2130",
              borderRadius: "10px",
              color: "#A0A4B8",
              fontWeight: 500,
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}
