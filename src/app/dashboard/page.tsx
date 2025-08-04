"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./dashboard.module.css";

import { motion } from "framer-motion";
import { StatsCard } from "@/components/StatsCard";
import { DebitCard } from "@/components/DebitCard";
import { RevealCard } from "@/components/RevealCard";
import { TransactionTable, Transaction } from "@/components/TransactionTable";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Sidebar from "@/components/Sidebar";
import CountUpNumber from "@/components/CountUpNumber";

interface APITransaction {
  _id: string;
  type: "deposit" | "send" | "transfer_usd" | "transfer_btc";
  currency: "USD" | "BTC";
  amount: number;
  date: string;
  description?: string;
}

interface UserData {
  name: string;
  balance: number;
  btcBalance: number;
  accountNumber: string;
  routingNumber: string;
  bitcoinAddress: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { status } = useSession();
  const router = useRouter();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [recentTxs, setRecentTxs] = useState<APITransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [btcRate, setBtcRate] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      fetchData();
      fetchRate();
      const iv = setInterval(fetchRate, 60_000);
      return () => clearInterval(iv);
    }
  }, [status]);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/user/dashboard", { credentials: "include" });
      const { user, recent } = await res.json();
      setUserData(user);
      setRecentTxs(recent);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRate() {
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
      );
      const data = await res.json();
      setBtcRate(data.bitcoin.usd);
    } catch {}
  }

  if (loading || !userData) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading your dashboard…</p>
      </div>
    );
  }

  const {
    name,
    balance,
    btcBalance,
    accountNumber,
    routingNumber,
    bitcoinAddress,
    createdAt,
  } = userData;

  const last4 = accountNumber.slice(-4);
  const cardNumber = `•••• •••• •••• ${last4}`;
  const reg = new Date(createdAt);
  reg.setFullYear(reg.getFullYear() + 5);
  const month = String(reg.getMonth() + 1).padStart(2, "0");
  const year = String(reg.getFullYear()).slice(-2);
  const expiry = `${month}/${year}`;

  const txns: Transaction[] = recentTxs.map((tx) => ({
    id: tx._id,
    description:
      tx.type === "send"
        ? `Sent $${Math.abs(tx.amount).toFixed(2)} to ${tx.description}`
        : tx.description ?? "—",
    amount: tx.amount,
    currency: tx.currency,
    status:
      tx.type === "send" || tx.type === "deposit" ? "Completed" : "Pending",
    date: tx.date,
    category:
      tx.type === "send"
        ? "Transfer"
        : tx.type === "deposit"
        ? "Deposit"
        : tx.type === "transfer_btc"
        ? "Crypto"
        : "Other",
  }));

  const fiatValue = btcBalance * btcRate;

  return (
    <div className={styles.dashboardContainer}>
      <Sidebar />
      <div style={{ marginLeft: "240px" }}>
        <Header />

        <motion.main
          className={styles.mainContent}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          {/* Stats & Card */}
          <motion.div
            className={`${styles.statsDebitRow} ${styles.sectionCard}`}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <StatsCard accountsCount={2} totalBalance={balance} />
            <DebitCard
              accountName={name}
              holderName={name}
              cardNumber={cardNumber}
              expiry={expiry}
            />
          </motion.div>

          {/* Balances & Actions */}
          <motion.div
            className={`${styles.balanceRow} ${styles.sectionCard}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className={styles.balanceCard}>
              <div className={styles.label}>USD Balance</div>
              <p className={styles.amount}>
                <CountUpNumber value={balance} prefix="$" decimals={2} />
              </p>
            </div>
            <div className={styles.balanceCard}>
              <div className={styles.label}>BTC Balance</div>
              <p className={styles.amount}>
                <CountUpNumber value={btcBalance} prefix="₿ " decimals={8} />
              </p>
              <p className={styles.fiatApprox}>
                ≈ <CountUpNumber value={fiatValue} prefix="$" decimals={2} /> USD
              </p>
            </div>
            <div className={styles.actions}>
              <motion.button
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                className={styles.actionButton}
              >
                Deposit USD
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                className={styles.actionButton}
              >
                Buy/Sell BTC
              </motion.button>
            </div>
          </motion.div>

          {/* Revealable Details */}
          <motion.div
            className={styles.detailCardsRow}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <RevealCard label="Account Number" value={accountNumber} />
            <RevealCard label="Routing Number" value={routingNumber} />
            <RevealCard label="Bitcoin Address" value={bitcoinAddress} />
          </motion.div>

          {/* Recent Transactions */}
          <motion.section
            className={`${styles.transactionsSection}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <h2 className={styles.sectionTitle}>Recent transactions</h2>
            <TransactionTable transactions={txns} />
          </motion.section>
        </motion.main>

        <Footer />
      </div>
    </div>
  );
}
