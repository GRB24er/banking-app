"use client";

export default function RegulatoryBanner() {
  return (
    <div
      style={{
        width: "100%",
        background: "#0f1219",
        borderTop: "1px solid rgba(255, 255, 255, 0.05)",
        padding: "12px 24px",
        textAlign: "center",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <p
        style={{
          color: "#6b7280",
          fontSize: 11,
          lineHeight: 1.6,
          margin: 0,
          maxWidth: 1000,
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        Horizon Global Capital Bank plc is authorised by the Prudential
        Regulation Authority and regulated by the Financial Conduct Authority
        and the Prudential Regulation Authority (FRN: 204503). Registered in
        England and Wales (Company No. 09736582). Registered office: 79 High
        Street, Brentford, TW8 8AE.
      </p>
    </div>
  );
}
