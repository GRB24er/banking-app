// src/app/profile/page.tsx

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import BackButton from '@/components/BackButton';
import styles from './profile.module.css';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return (
      <html>
        <body>
          <script>window.location.href = '/auth/signin';</script>
        </body>
      </html>
    );
  }

  await dbConnect();
  const user = await User.findById(session.user.id).lean();
  if (!user) {
    return <p className={styles.error}>User not found.</p>;
  }

  const { name, email, role, balance = 0, btcBalance = 0 } = user;

  return (
    <div className={styles.container}>
      <BackButton />

      <h1 className={styles.title}>My Profile</h1>

      <div className={styles.infoBox}>
        <p><strong>Name:</strong> {name}</p>
        <p><strong>Email:</strong> {email}</p>
        <p><strong>Role:</strong> {role.charAt(0).toUpperCase() + role.slice(1)}</p>
        <p><strong>USD Balance:</strong> ${balance.toFixed(2)}</p>
        <p><strong>BTC Balance:</strong> {btcBalance.toFixed(6)} BTC</p>
      </div>

      {/* Sign Out form */}
      <div className={styles.signOutContainer}>
        <form action="/api/auth/signout" method="post">
          <button type="submit" className={styles.signOutLink}>
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );
}
