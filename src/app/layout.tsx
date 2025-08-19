import "./globals.css";
import { ReactNode } from "react";
import { Providers } from "@/components/Providers";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Horizon Global Capital",
  description: "Your premier banking and investment platform",
  keywords: "banking, investment, finance, portfolio management",
  authors: [{ name: "Horizon Global Capital" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({ 
  children 
}: { 
  children: ReactNode 
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body suppressHydrationWarning>
        <Providers>
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}