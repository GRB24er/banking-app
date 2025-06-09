// src/app/layout.tsx
'use client';

import { SessionProvider } from 'next-auth/react';
import './globals.css'; // if you have global CSS

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* SessionProvider makes `useSession()` work throughout your app */}
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
