import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]/route';
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

  const user = session.user as {
    name: string;
    email: string;
    role: string;
    balance?: number;
    btcBalance?: number;
  };

  // Default missing balances to 0
  const usdBalance = user.balance ?? 0;
  const btcBalance = user.btcBalance ?? 0;

  return (
    <div className={styles.container}>
      {/* ← BackButton is a client component */}
      <BackButton />

      <h1 className={styles.title}>My Profile</h1>

      <div className={styles.infoBox}>
        <p>
          <strong>Name:</strong> {user.name}
        </p>
        <p>
          <strong>Email:</strong> {user.email}
        </p>
        <p>
          <strong>Role:</strong>{' '}
          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
        </p>
        <p>
          <strong>USD Balance:</strong> ${usdBalance.toFixed(2)}
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
