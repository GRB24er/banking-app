import './globals.css';
import { ReactNode } from 'react';
import { Providers } from '@/components/Providers';
import { Header } from '@/components/Header';

export const metadata = {
  title: 'Horizon Global Capital',
  description: 'Your banking dashboard',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Header />
          <main style={{ padding: '1rem', fontFamily: 'Segoe UI' }}>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
