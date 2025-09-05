// src/app/transfers/internal/page.tsx (FIXED)
"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import styles from "./sendMoney.module.css";

// Constants for better maintainability
const SUCCESS_REDIRECT_DELAY = 3000;
const MILLION_THRESHOLD = 1000000;

export default function SendMoneyPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Account types as constants
  const ACCOUNT_TYPES = {
    CHECKING: "checking",
    SAVINGS: "savings",
    INVESTMENT: "investment"
  } as const;

  // Initial state for account balances
  const [accountBalances, setAccountBalances] = useState({
    [ACCOUNT_TYPES.CHECKING]: 0,
    [ACCOUNT_TYPES.SAVINGS]: 0,
    [ACCOUNT_TYPES.INVESTMENT]: 0
  });

  const [formData, setFormData] = useState({
    recipientName: "",
    recipientAccount: "",
    recipientBank: "",
    amount: "",
    accountType: ACCOUNT_TYPES.CHECKING,
    description: "",
    transferType: "domestic"
  });

  // Fetch actual user balances
  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const response = await fetch('/api/user/dashboard');
        if (response.ok) {
          const data = await response.json();
          setAccountBalances({
            [ACCOUNT_TYPES.CHECKING]: data.balances?.[ACCOUNT_TYPES.CHECKING] || 0,
            [ACCOUNT_TYPES.SAVINGS]: data.balances?.[ACCOUNT_TYPES.SAVINGS] || 0,
            [ACCOUNT_TYPES.INVESTMENT]: data.balances?.[ACCOUNT_TYPES.INVESTMENT] || 0
          });
        }
      } catch (error) {
        console.error('Error fetching balances:', error);
      }
    };

    if (session) {
      fetchBalances();
    }
  }, [session, ACCOUNT_TYPES.CHECKING, ACCOUNT_TYPES.SAVINGS, ACCOUNT_TYPES.INVESTMENT]);

  const formatBalance = (type: keyof typeof accountBalances) => {
    const balance = accountBalances[type];
    if (type === ACCOUNT_TYPES.INVESTMENT && balance > MILLION_THRESHOLD) {
      return `$${(balance / MILLION_THRESHOLD).toFixed(2)}M`;
    }
    return `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate amount is a positive number
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    // Validate amount doesn't exceed balance
    const balance = accountBalances[formData.accountType as keyof typeof accountBalances];
    
    if (amount > balance) {
      setError("Insufficient funds in selected account");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/transfers/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          status: 'pending' // Always create as pending for approval
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Transaction failed");
      }

      setSuccess("Transfer initiated successfully! Pending admin approval.");
      
      // Show success then redirect
      setTimeout(() => {
        router.push("/transactions");
      }, SUCCESS_REDIRECT_DELAY);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className={styles.container}>
      <Sidebar />
      <div className={styles.mainContent}>
        <Header />
        <div className={styles.content}>
          <div className={styles.formContainer}>
            <h2>Internal Transfer</h2>
            <p className={styles.subtitle}>Transfer money between your accounts</p>

            <form onSubmit={handleSubmit} className={styles.form}>
              {/* Account Selection */}
              <div className={styles.section}>
                <h3>From Account</h3>
                <div className={styles.accountSelection}>
                  {Object.entries(ACCOUNT_TYPES).map(([key, value]) => (
                    <div key={value} className={styles.accountOption}>
                      <input
                        type="radio"
                        id={value}
                        name="accountType"
                        value={value}
                        checked={formData.accountType === value}
                        onChange={handleInputChange}
                      />
                      <label htmlFor={value}>
                        {value.charAt(0).toUpperCase() + value.slice(1)} Account - {formatBalance(value as keyof typeof accountBalances)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transfer Details */}
              <div className={styles.section}>
                <h3>Transfer Details</h3>
                <div className={styles.inputGroup}>
                  <input
                    type="number"
                    name="amount"
                    placeholder="Amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    required
                    min="0.01"
                    step="0.01"
                    className={styles.input}
                  />
                  <textarea
                    name="description"
                    placeholder="Description (Optional)"
                    value={formData.description}
                    onChange={handleInputChange}
                    className={styles.textarea}
                    rows={3}
                  />
                </div>
              </div>

              {error && <div className={styles.error}>{error}</div>}
              {success && <div className={styles.success}>{success}</div>}

              <button 
                type="submit" 
                className={styles.submitButton}
                disabled={loading}
              >
                {loading ? "Processing..." : "Transfer Money"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}