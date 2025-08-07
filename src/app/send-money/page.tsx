// File: src/app/send-money/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./sendMoney.module.css";

type DestMethod = "email" | "phone" | "bank";
type SourceAccount = "checking" | "savings" | "investment";

interface CountryConfig {
  label: string;
  fields: { id: string; label: string; placeholder?: string; type?: string }[];
}

interface ConfirmData {
  reference: string;
  date: string;
  from: string;
  to: string;
  amount: number;
  memo: string;
}

// Configuration for each country’s required fields
const countryConfigs: Record<string, CountryConfig> = {
  US: {
    label: "United States",
    fields: [
      { id: "accountNumber", label: "Account Number", placeholder: "12345678" },
      { id: "routingNumber", label: "Routing Number", placeholder: "021000021" },
    ],
  },
  UK: {
    label: "United Kingdom",
    fields: [
      { id: "accountNumber", label: "Account Number", placeholder: "01234567" },
      { id: "sortCode", label: "Sort Code", placeholder: "12-34-56" },
    ],
  },
  IN: {
    label: "India",
    fields: [
      { id: "accountNumber", label: "Account Number", placeholder: "12345678901" },
      { id: "ifsc", label: "IFSC Code", placeholder: "ABCD0123456" },
    ],
  },
  IBAN: {
    label: "Any IBAN Country",
    fields: [
      { id: "iban", label: "IBAN", placeholder: "DE89 3704 0044 0532 0130 00" },
      { id: "swift", label: "SWIFT/BIC", placeholder: "DEUTDEFF" },
    ],
  },
};

export default function SendMoneyPage() {
  const router = useRouter();

  // Form state
  const [source, setSource] = useState<SourceAccount>("checking");
  const [method, setMethod] = useState<DestMethod>("email");
  const [country, setCountry] = useState<string>("US");

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [amount, setAmount] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmData | null>(null);

  // Initialize country-specific fields whenever country changes
  useEffect(() => {
    const cfg = countryConfigs[country];
    const initial: Record<string, string> = {};
    cfg.fields.forEach((f) => {
      initial[f.id] = "";
    });
    setFields(initial);
  }, [country]);

  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const amtNum = parseFloat(amount);
    if (!amtNum || amtNum <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    if (method === "email" && !email) {
      setError("Enter recipient email.");
      return;
    }
    if (method === "phone" && !phone) {
      setError("Enter recipient phone.");
      return;
    }
    if (method === "bank") {
      const cfg = countryConfigs[country];
      for (let f of cfg.fields) {
        if (!fields[f.id]) {
          setError(`Enter ${f.label}.`);
          return;
        }
      }
    }

    const payload: any = { source, amount: amtNum, method };
    let toDesc = "";
    if (method === "email") {
      payload.email = email;
      toDesc = email;
    } else if (method === "phone") {
      payload.phone = phone;
      toDesc = phone;
    } else {
      payload.country = country;
      countryConfigs[country].fields.forEach((f) => {
        payload[f.id] = fields[f.id];
      });
      toDesc = `${countryConfigs[country].label} Transfer`;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/user/transfer", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Transfer failed");

      const tx = data.transaction;
      setConfirm({
        reference: tx.reference,
        date: new Date(tx.date).toLocaleDateString(),
        from: source.charAt(0).toUpperCase() + source.slice(1),
        to: toDesc,
        amount: tx.amount,
        memo: tx.description || "Online Transfer",
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Confirmation modal
  if (confirm) {
    return (
      <div className={styles.overlay}>
        <div className={styles.card}>
          <div className={styles.checkmark}>✓</div>
          <h2 className={styles.confirmTitle}>Transaction Authorized</h2>
          <p className={styles.confirmText}>
            #{confirm.reference} scheduled on {confirm.date}
          </p>
          <div className={styles.confirmDetails}>
            <div>
              <strong>From:</strong> {confirm.from}
            </div>
            <div>
              <strong>To:</strong> {confirm.to}
            </div>
            <div>
              <strong>Amount:</strong> ${confirm.amount.toFixed(2)}
            </div>
            <div>
              <strong>Memo:</strong> {confirm.memo}
            </div>
          </div>
          <div className={styles.confirmActions}>
            <button
              className={styles.secondaryBtn}
              onClick={() => {
                router.push("/dashboard/transfers");
                router.refresh();
              }}
            >
              Manage Transfer
            </button>
            <button
              className={styles.primaryBtn}
              onClick={() => {
                router.push("/dashboard");
                router.refresh();
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <button onClick={() => router.back()} className={styles.backLink}>
          ← Back
        </button>
        <h2 className={styles.title}>Send Money</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Source Account */}
          <div className={styles.field}>
            <label>From Account</label>
            <select
              value={source}
              onChange={(e) =>
                setSource(e.target.value as SourceAccount)
              }
            >
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
              <option value="investment">Investment</option>
            </select>
          </div>

          {/* Destination Method */}
          <div className={styles.field}>
            <label>Destination Method</label>
            <select
              value={method}
              onChange={(e) =>
                setMethod(e.target.value as DestMethod)
              }
            >
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="bank">Bank Transfer</option>
            </select>
          </div>

          {/* Conditional Inputs */}
          {method === "email" && (
            <div className={styles.field}>
              <label>Recipient Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
          )}

          {method === "phone" && (
            <div className={styles.field}>
              <label>Recipient Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 123 4567"
              />
            </div>
          )}

          {method === "bank" && (
            <>
              <div className={styles.field}>
                <label>Country</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                >
                  {Object.entries(countryConfigs).map(
                    ([code, cfg]) => (
                      <option key={code} value={code}>
                        {cfg.label}
                      </option>
                    )
                  )}
                </select>
              </div>
              {countryConfigs[country].fields.map((f) => (
                <div key={f.id} className={styles.field}>
                  <label>{f.label}</label>
                  <input
                    type={f.type || "text"}
                    placeholder={f.placeholder}
                    value={fields[f.id] || ""}
                    onChange={(e) =>
                      setFields({
                        ...fields,
                        [f.id]: e.target.value,
                      })
                    }
                  />
                </div>
              ))}
            </>
          )}

          {/* Amount */}
          <div className={styles.field}>
            <label>Amount (USD)</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100.00"
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? "Sending…" : "Send Money"}
          </button>
        </form>
      </div>
    </div>
  );
}
