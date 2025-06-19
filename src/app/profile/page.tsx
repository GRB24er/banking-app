// src/app/profile/page.tsx
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import BackButton from '../../components/BackButton';
import styles from './profile.module.css';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return (
      <html>
        <body>
          <script>{`window.location.href = '/auth/signin';`}</script>
        </body>
      </html>
    );
  }

  const { name, email, role, balance = 0, btcBalance = 0 } = session.user as {
    name: string;
    email: string;
    role: string;
    balance?: number;
    btcBalance?: number;
  };

  return (
    <div className={styles.container}>
      {/* ← BackButton is a client component */}
      <BackButton />

      <h1 className={styles.title}>My Profile</h1>

      <div className={styles.infoBox}>
        <p>
          <strong>Name:</strong> {name}
        </p>
        <p>
          <strong>Email:</strong> {email}
        </p>
        <p>
          <strong>Role:</strong>{' '}
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </p>
        <p>
          <strong>USD Balance:</strong> ${balance.toFixed(2)}
        </p>
        <p>
          <strong>BTC Balance:</strong> {btcBalance.toFixed(6)} BTC
        </p>
      </div>

      {/* Sign Out link */}
      <div className={styles.signOutContainer}>
        <a href="/api/auth/signout" className={styles.signOutLink}>
          Sign Out
        </a>
      </div>
    </div>
  );
}
