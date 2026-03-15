// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Chatbox from "@/components/Chatbox";
import CookieConsent from "@/components/CookieConsent";
import RegulatoryBanner from "@/components/RegulatoryBanner";

export const metadata: Metadata = {
  title: "Horizon Global Capital | Private Banking & Wealth Management",
  description: "Premier digital banking institution delivering sophisticated financial services with institutional-grade security, dedicated client support, and global market access.",
  keywords: "private banking, wealth management, digital banking, investment, global capital",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:wght@400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body>
        <Providers>
          {children}
          <Chatbox />
          <CookieConsent />
        </Providers>
        <RegulatoryBanner />
      </body>
    </html>
  );
}
