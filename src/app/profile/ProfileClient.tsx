// File: src/app/profile/ProfileClient.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import styles from "./profile.module.css";

interface AccountInfo {
  type: string;
  accountNumber: string;
  balance: number;
}

interface ProfileData {
  name:      string;
  email:     string;
  phone?:    string;
  kycStatus: "Verified" | "Pending";
  accounts:  AccountInfo[];
}

export default function ProfileClient() {
  const router = useRouter();
  const [data, setData]     = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string|null>(null);

  useEffect(() => {
    fetch("/api/user/profile", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load profile");
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading profile…</p>;
  if (error)   return <p className={styles.error}>{error}</p>;
  if (!data)  return <p>No profile data.</p>;

  const initials = data.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.container}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <button onClick={() => router.back()} className={styles.backLink}>
          ← Back
        </button>

        <div className={styles.avatar}>{initials}</div>
        <h1 className={styles.title}>{data.name}</h1>
        <p className={styles.email}>{data.email}</p>
        {data.phone && <p className={styles.phone}>📞 {data.phone}</p>}

        <p className={styles.kyc}>
          KYC Status:{" "}
          <span
            className={
              data.kycStatus === "Verified"
                ? styles.kycVerified
                : styles.kycPending
            }
          >
            {data.kycStatus}
          </span>
        </p>

        <div className={styles.accounts}>
          {data.accounts.map((acct) => (
            <div key={acct.type} className={styles.accountCard}>
              <div className={styles.acctType}>{acct.type}</div>
              <div className={styles.acctNumber}>{acct.accountNumber}</div>
              <div className={styles.acctBalance}>
                ${acct.balance.toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.links}>
          <button
            onClick={() => router.push("/support/contact")}
            className={styles.supportBtn}
          >
            Contact Support
          </button>
          <button
            onClick={() => router.push("/help-center")}
            className={styles.helpBtn}
          >
            Help Center
          </button>
        </div>
      </motion.div>
    </div>
  );
}
