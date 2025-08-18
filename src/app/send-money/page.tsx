"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import styles from "./sendMoney.module.css";

export default function SendMoneyPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [formData, setFormData] = useState({
    recipientName: "",
    recipientAccount: "",
    recipientBank: "",
    amount: "",
    accountType: "checking",
    description: "",
    transferType: "domestic"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/transactions/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Transaction failed");
      }

      setSuccess("Transaction initiated successfully! Pending approval.");
      setTimeout(() => {
        router.push("/transactions");
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <Sidebar />
      <div className={styles.main}>
        <Header />
        
        <div className={styles.content}>
          <div className={styles.pageHeader}>
            <h1>Send Money</h1>
            <p>Transfer funds securely to any account</p>
          </div>

          <div className={styles.formCard}>
            <form onSubmit={handleSubmit}>
              {/* From Account */}
              <div className={styles.section}>
                <h3>From Account</h3>
                <select
                  value={formData.accountType}
                  onChange={(e) => setFormData({...formData, accountType: e.target.value})}
                  className={styles.select}
                >
                  <option value="checking">Checking - $4,000.00</option>
                  <option value="savings">Savings - $1,000.00</option>
                  <option value="investment">Investment - $45.46M</option>
                </select>
              </div>

              {/* Recipient Details */}
              <div className={styles.section}>
                <h3>Recipient Details</h3>
                <div className={styles.inputGroup}>
                  <input
                    type="text"
                    placeholder="Recipient Name"
                    value={formData.recipientName}
                    onChange={(e) => setFormData({...formData, recipientName: e.target.value})}
                    required
                    className={styles.input}
                  />
                  <input
                    type="text"
                    placeholder="Account Number"
                    value={formData.recipientAccount}
                    onChange={(e) => setFormData({...formData, recipientAccount: e.target.value})}
                    required
                    className={styles.input}
                  />
                  <input
                    type="text"
                    placeholder="Bank Name"
                    value={formData.recipientBank}
                    onChange={(e) => setFormData({...formData, recipientBank: e.target.value})}
                    required
                    className={styles.input}
                  />
                </div>
              </div>

              {/* Transfer Details */}
              <div className={styles.section}>
                <h3>Transfer Details</h3>
                <div className={styles.inputGroup}>
                  <input
                    type="number"
                    placeholder="Amount"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    required
                    min="1"
                    step="0.01"
                    className={styles.input}
                  />
                  <textarea
                    placeholder="Description (Optional)"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
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
                {loading ? "Processing..." : "Send Money"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}