"use client";

import { motion } from "framer-motion";
import styles from "./profile.module.css";
import BackButton from "@/components/BackButton";

interface UserProps {
  user: {
    name: string;
    email: string;
    role: string;
    balance: number;
    btcBalance: number;
  };
}

export default function ProfileClient({ user }: UserProps) {
  const { name, email, role, balance = 0, btcBalance = 0 } = user;

  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.container}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <BackButton />

        <div className={styles.avatar}>{initials}</div>

        <h1 className={styles.title}>My Profile</h1>

        <motion.div
          className={styles.infoBox}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <p>
            <strong>Name:</strong> {name}
          </p>
          <p>
            <strong>Email:</strong> {email}
          </p>
          <p>
            <strong>Role:</strong> {role.charAt(0).toUpperCase() + role.slice(1)}
          </p>
          <p>
            <strong>USD Balance:</strong> ${balance.toFixed(2)}
          </p>
          <p>
            <strong>BTC Balance:</strong> {btcBalance.toFixed(6)} BTC
          </p>
        </motion.div>

        <motion.div
          className={styles.signOutContainer}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <form action="/api/auth/signout" method="post">
            <button type="submit" className={styles.signOutLink}>
              Sign Out
            </button>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
}
