// File: src/components/Header.tsx

'use client';

import { signOut, useSession } from 'next-auth/react';
import Link                     from 'next/link';
import Image                    from 'next/image';
import styles                   from './Header.module.css';

export function Header() {
  const { data: session } = useSession();

  return (
    <header className={styles.header}>
      {/* Logo & Brand */}
      <div className={styles.logo}>
        <Image src="/icons/logo.svg" alt="Logo" width={32} height={32} />
        <span className={styles.brandName}>Horizon Global Capital</span>
      </div>

      {/* Session-aware nav: only renders when session is truthy */}
      <nav className={styles.navLinks}>
        {session && (
          <>
            <Link href="/dashboard" className={styles.navLink}>
              Dashboard
            </Link>
            <Link href="/profile" className={styles.navLink}>
              Profile
            </Link>
            <Link href="/send-money" className={styles.navLink}>
              Send Money
            </Link>
            <Link href="/settings" className={styles.navLink}>
              Settings
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              className={styles.signOutLink}
            >
              Sign Out
            </button>
          </>
        )}
      </nav>
    </header>
  );
}
