// File: src/app/reports/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";            // ← added icons
import styles from "./reports.module.css";
import CountUpNumber from "@/components/CountUpNumber";

interface FormattedTxn {
  _id:        string;
  type:       string;
  currency:   string;
  amount:     number;
  date:       string;
  description?: string;
}

interface Metrics {
  totalDeposits:    number;
  totalWithdrawals: number;
  netChange:        number;
}

export default function ReportsPage() {
  const router = useRouter();
  const [startDate, setStartDate]     = useState("");
  const [endDate, setEndDate]         = useState("");
  const [metrics, setMetrics]         = useState<Metrics | null>(null);
  const [txns, setTxns]               = useState<FormattedTxn[]>([]);
  const [loadingReport, setLoadingReport] = useState(false);

  async function handleGenerate() {
    if (!startDate || !endDate) return;
    setLoadingReport(true);
    try {
      const res = await fetch(
        `/api/user/reports?startDate=${startDate}&endDate=${endDate}`,
        { credentials: "include" }
      );
      const data = await res.json();
      setMetrics(data.metrics);
      setTxns(data.transactions);
    } catch (err) {
      console.error("Error fetching report:", err);
    } finally {
      setLoadingReport(false);
    }
  }

  return (
    <div className={styles.container}>
      {/* Back button with icon */}
      <button
        onClick={() => router.push("/dashboard")}
        className={styles.backButton}
      >
        <ArrowLeft size={16} style={{ marginRight: 4 }} />
        Back to Dashboard
      </button>

      {/* Title with icon */}
      <h1 className={styles.title}>
        <FileText size={24} style={{ verticalAlign: "middle", marginRight: 8 }} />
        Reports
      </h1>

      {/* Date filters + generate */}
      <div className={styles.filters}>
        <div className={styles.dateGroup}>
          <label htmlFor="start" className={styles.label}>
            From:
            <input
              id="start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={styles.dateInput}
            />
          </label>
        </div>

        <div className={styles.dateGroup}>
          <label htmlFor="end" className={styles.label}>
            To:
            <input
              id="end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={styles.dateInput}
            />
          </label>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!startDate || !endDate || loadingReport}
          className={styles.generateButton}
        >
          {loadingReport ? "Loading…" : "Generate Report"}
        </button>
      </div>

      {/* Metrics */}
      {metrics && (
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricTitle}>Total Deposits</div>
            <div className={styles.metricValue}>
              <CountUpNumber value={metrics.totalDeposits} prefix="$" decimals={2} />
            </div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricTitle}>Total Withdrawals</div>
            <div className={styles.metricValue}>
              <CountUpNumber value={metrics.totalWithdrawals} prefix="$" decimals={2} />
            </div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricTitle}>Net Change</div>
            <div className={styles.metricValue}>
              <CountUpNumber value={metrics.netChange} prefix="$" decimals={2} />
            </div>
          </div>
        </div>
      )}

      {/* Transactions table */}
      {txns.length > 0 && (
        <table className={styles.txTable}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Type</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {txns.map((t) => (
              <tr key={t._id}>
                <td>{new Date(t.date).toLocaleDateString()}</td>
                <td>{t.description ?? "—"}</td>
                <td>{t.type}</td>
                <td>
                  {t.currency === "USD" ? "$" : ""}
                  {t.amount.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
);
}
