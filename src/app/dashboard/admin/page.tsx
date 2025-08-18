"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import styles from "./admin.module.css";

interface User {
  _id: string;
  name: string;
  email: string;
  checkingBalance: number;
  savingsBalance: number;
  investmentBalance: number;
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  
  const [transactionForm, setTransactionForm] = useState({
    type: "credit",
    amount: "",
    accountType: "checking",
    description: ""
  });

  useEffect(() => {
    // Check if admin
    if (session?.user?.email !== "admin@horizonbank.com") {
      router.push("/dashboard");
    } else {
      fetchUsers();
    }
  }, [session]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/user/${selectedUser._id}/transaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transactionForm)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Transaction failed");
      }

      setMessage(`✅ ${data.message}`);
      
      // Reset form
      setTransactionForm({
        type: "credit",
        amount: "",
        accountType: "checking",
        description: ""
      });
      
      // Refresh users to show updated balances
      await fetchUsers();
      
    } catch (error: any) {
      setMessage(`❌ ${error.message}`);
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
            <h1>Admin Dashboard</h1>
            <p>Manage user accounts and transactions</p>
          </div>

          <div className={styles.grid}>
            {/* Quick Actions */}
            <div className={styles.card}>
              <h2>Quick Actions</h2>
              <div className={styles.actions}>
                <button 
                  onClick={() => router.push("/admin/transactions")}
                  className={styles.actionButton}
                >
                  🔍 Review Pending Transactions
                </button>
                <button 
                  onClick={() => router.push("/admin/users")}
                  className={styles.actionButton}
                >
                  👥 Manage Users
                </button>
              </div>
            </div>

            {/* Credit/Debit Form */}
            <div className={styles.card}>
              <h2>Credit/Debit Account</h2>
              
              {/* User Selection */}
              <div className={styles.formGroup}>
                <label>Select User</label>
                <select 
                  onChange={(e) => {
                    const user = users.find(u => u._id === e.target.value);
                    setSelectedUser(user || null);
                  }}
                  className={styles.select}
                >
                  <option value="">-- Select User --</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              {selectedUser && (
                <>
                  {/* Show current balances */}
                  <div className={styles.balances}>
                    <div>Checking: ${selectedUser.checkingBalance.toLocaleString()}</div>
                    <div>Savings: ${selectedUser.savingsBalance.toLocaleString()}</div>
                    <div>Investment: ${(selectedUser.investmentBalance / 1000000).toFixed(2)}M</div>
                  </div>

                  {/* Transaction Form */}
                  <form onSubmit={handleTransaction}>
                    <div className={styles.formGroup}>
                      <label>Transaction Type</label>
                      <select
                        value={transactionForm.type}
                        onChange={(e) => setTransactionForm({...transactionForm, type: e.target.value})}
                        className={styles.select}
                      >
                        <option value="credit">Credit (Add Money)</option>
                        <option value="debit">Debit (Remove Money)</option>
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Account</label>
                      <select
                        value={transactionForm.accountType}
                        onChange={(e) => setTransactionForm({...transactionForm, accountType: e.target.value})}
                        className={styles.select}
                      >
                        <option value="checking">Checking</option>
                        <option value="savings">Savings</option>
                        <option value="investment">Investment</option>
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Amount</label>
                      <input
                        type="number"
                        value={transactionForm.amount}
                        onChange={(e) => setTransactionForm({...transactionForm, amount: e.target.value})}
                        placeholder="Enter amount"
                        required
                        min="0.01"
                        step="0.01"
                        className={styles.input}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Description (Optional)</label>
                      <input
                        type="text"
                        value={transactionForm.description}
                        onChange={(e) => setTransactionForm({...transactionForm, description: e.target.value})}
                        placeholder="Transaction description"
                        className={styles.input}
                      />
                    </div>

                    {message && (
                      <div className={message.startsWith("✅") ? styles.success : styles.error}>
                        {message}
                      </div>
                    )}

                    <button 
                      type="submit" 
                      className={styles.submitButton}
                      disabled={loading}
                    >
                      {loading ? "Processing..." : "Execute Transaction"}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
