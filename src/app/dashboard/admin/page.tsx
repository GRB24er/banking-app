// src/app/admin/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./admin.module.css";

interface User {
  _id: string;
  name: string;
  email: string;
  checkingBalance: number;
  savingsBalance: number;
  investmentBalance: number;
  verified?: boolean;
  role?: string;
}

interface Transaction {
  _id: string;
  reference: string;
  userId: any;
  type: string;
  amount: number;
  description: string;
  status: string;
  date: string;
  accountType: string;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("users");
  
  // Transaction form for credit/debit
  const [transactionForm, setTransactionForm] = useState({
    type: "deposit",
    amount: "",
    accountType: "checking",
    description: "",
    sendEmail: true,
    emailType: "credit"
  });

  // Edit transaction form
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState({
    amount: "",
    description: "",
    date: "",
    status: ""
  });

  // Load users and transactions on mount
  useEffect(() => {
    loadUsers();
    loadTransactions();
  }, []);

  // LOAD ALL USERS
  // Update your loadUsers function in src/app/admin/page.tsx
// Replace your current loadUsers function with this:

const loadUsers = async () => {
  setLoading(true);
  setMessage("Loading users from database...");
  
  try {
    console.log('Fetching users from API...');
    
    const response = await fetch("/api/admin/users", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: 'no-store' // Prevent caching issues
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    // Check if response is OK
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Get response text first to debug
    const responseText = await response.text();
    console.log('Raw response:', responseText);
    
    // Try to parse JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Response was:', responseText);
      throw new Error('Invalid JSON response from server');
    }
    
    console.log('Parsed data:', data);
    
    if (data.success && data.users) {
      setUsers(data.users);
      setMessage(`✅ Loaded ${data.users.length} users from database`);
      setTimeout(() => setMessage(""), 3000);
    } else {
      setMessage(`⚠️ ${data.error || 'No users found in database'}`);
      setUsers([]);
    }
  } catch (error: any) {
    console.error("Failed to load users:", error);
    setMessage(`❌ Error: ${error.message}`);
    setUsers([]);
    
    // Try the test endpoint to see if API routes work at all
    try {
      console.log('Trying test endpoint...');
      const testResponse = await fetch("/api/admin/test-users");
      const testData = await testResponse.json();
      console.log('Test endpoint response:', testData);
      
      if (testData.success && testData.users) {
        setMessage("⚠️ Using test data - check your database connection");
        setUsers(testData.users);
      }
    } catch (testError) {
      console.error('Test endpoint also failed:', testError);
    }
  } finally {
    setLoading(false);
  }
};

  // LOAD ALL TRANSACTIONS
  const loadTransactions = async () => {
    try {
      const response = await fetch("/api/admin/transactions", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        }
      });
      
      const data = await response.json();
      
      if (data.transactions) {
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error("Failed to load transactions:", error);
    }
  };

  // PROCESS TRANSACTION (CREDIT/DEBIT USER)
// UPDATE THIS IN YOUR: src/app/dashboard/admin/page.tsx
// Replace your handleTransaction function with this:

const handleTransaction = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!selectedUser) {
    setMessage("❌ Please select a user first");
    return;
  }

  if (!transactionForm.amount || parseFloat(transactionForm.amount) <= 0) {
    setMessage("❌ Please enter a valid amount");
    return;
  }

  setLoading(true);
  setMessage("Processing transaction...");
  
  try {
    // Use the new create-transaction endpoint
    const response = await fetch("/api/admin/create-transaction", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        userId: selectedUser._id,  // Pass userId in the body
        type: transactionForm.type,
        amount: parseFloat(transactionForm.amount),
        accountType: transactionForm.accountType,
        description: transactionForm.description || `Admin ${transactionForm.type}`,
        status: "completed"
      })
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);

    if (response.ok && data.success) {
      setMessage(`✅ ${data.message}`);
      
      // Update the selected user's balance locally for immediate UI update
      if (selectedUser) {
        const updatedUser = { ...selectedUser };
        if (transactionForm.accountType === 'checking') {
          updatedUser.checkingBalance = data.newBalance;
        } else if (transactionForm.accountType === 'savings') {
          updatedUser.savingsBalance = data.newBalance;
        } else if (transactionForm.accountType === 'investment') {
          updatedUser.investmentBalance = data.newBalance;
        }
        setSelectedUser(updatedUser);
      }
      
      // Reset form
      setTransactionForm({
        type: "deposit",
        amount: "",
        accountType: "checking",
        description: "",
        sendEmail: true,
        emailType: "credit"
      });
      
      // Reload users and transactions to show updates
      await loadUsers();
      await loadTransactions();
      
      // Clear success message after 5 seconds
      setTimeout(() => setMessage(""), 5000);
    } else {
      setMessage(`❌ Error: ${data.error || 'Transaction failed'}`);
    }
  } catch (error: any) {
    console.error("Transaction error:", error);
    setMessage(`❌ Failed to process transaction: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

  // APPROVE TRANSACTION
  const approveTransaction = async (transactionId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/transactions/${transactionId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sendNotification: true,
          customMessage: "Your transaction has been approved and processed."
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Transaction approved successfully!");
        await loadTransactions();
        await loadUsers();
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage("Failed to approve transaction");
    } finally {
      setLoading(false);
    }
  };

  // DECLINE TRANSACTION
  const declineTransaction = async (transactionId: string) => {
    const reason = prompt("Please provide a reason for declining:");
    if (!reason) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/transactions/${transactionId}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: reason,
          sendNotification: true
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Transaction declined");
        await loadTransactions();
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage("Failed to decline transaction");
    } finally {
      setLoading(false);
    }
  };

  // EDIT TRANSACTION
  const startEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditForm({
      amount: transaction.amount.toString(),
      description: transaction.description,
      date: transaction.date,
      status: transaction.status
    });
    setActiveTab("edit-transaction");
  };

  // SAVE EDITED TRANSACTION
  const saveEditedTransaction = async () => {
    if (!editingTransaction) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/transactions/${editingTransaction._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(editForm.amount),
          description: editForm.description,
          date: editForm.date,
          status: editForm.status,
          sendEmail: true,
          emailType: "update"
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Transaction updated successfully!");
        setEditingTransaction(null);
        setActiveTab("transactions");
        await loadTransactions();
        await loadUsers();
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage("Failed to update transaction");
    } finally {
      setLoading(false);
    }
  };

  // SEND EMAIL NOTIFICATION
  const sendTransactionEmail = async (email: string, transaction: any) => {
    try {
      const response = await fetch("/api/admin/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          transaction: transaction,
          emailType: transactionForm.emailType
        })
      });

      if (response.ok) {
        console.log("Email sent successfully");
      }
    } catch (error) {
      console.error("Failed to send email:", error);
    }
  };

  // DELETE TRANSACTION
  const deleteTransaction = async (transactionId: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/transactions/${transactionId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        setMessage("Transaction deleted");
        await loadTransactions();
        await loadUsers();
      } else {
        const data = await response.json();
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage("Failed to delete transaction");
    } finally {
      setLoading(false);
    }
  };

  // Get user's transactions
  const getUserTransactions = (userId: string) => {
    return transactions.filter(t => 
      t.userId && (t.userId._id === userId || t.userId === userId)
    );
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h1>Admin Dashboard - Transaction Management</h1>
          <div className={styles.headerActions}>
            <button onClick={loadUsers} disabled={loading}>
              Refresh Users
            </button>
            <button onClick={loadTransactions} disabled={loading}>
              Refresh Transactions
            </button>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={styles.message}>
            {message}
          </div>
        )}

        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <h3>Total Users</h3>
            <p>{users.length}</p>
          </div>
          <div className={styles.statCard}>
            <h3>Total Transactions</h3>
            <p>{transactions.length}</p>
          </div>
          <div className={styles.statCard}>
            <h3>Pending Transactions</h3>
            <p>{transactions.filter(t => t.status === 'pending').length}</p>
          </div>
          <div className={styles.statCard}>
            <h3>Selected User</h3>
            <p>{selectedUser ? selectedUser.name : "None"}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button 
            className={activeTab === "users" ? styles.activeTab : ""}
            onClick={() => setActiveTab("users")}
          >
            Users ({users.length})
          </button>
          <button 
            className={activeTab === "credit-debit" ? styles.activeTab : ""}
            onClick={() => setActiveTab("credit-debit")}
            disabled={!selectedUser}
          >
            Credit/Debit User
          </button>
          <button 
            className={activeTab === "transactions" ? styles.activeTab : ""}
            onClick={() => setActiveTab("transactions")}
          >
            All Transactions ({transactions.length})
          </button>
          {editingTransaction && (
            <button 
              className={activeTab === "edit-transaction" ? styles.activeTab : ""}
              onClick={() => setActiveTab("edit-transaction")}
            >
              Edit Transaction
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className={styles.content}>
          
          {/* USERS TAB */}
          {activeTab === "users" && (
            <div className={styles.usersSection}>
              <h2>All Users</h2>
              
              {loading ? (
                <p>Loading users...</p>
              ) : users.length === 0 ? (
                <p>No users found</p>
              ) : (
                <div className={styles.usersGrid}>
                  {users.map(user => (
                    <div 
                      key={user._id}
                      className={`${styles.userCard} ${selectedUser?._id === user._id ? styles.selected : ''}`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <h3>{user.name}</h3>
                      <p>{user.email}</p>
                      <div className={styles.balances}>
                        <div>
                          <span>Checking:</span>
                          <strong>${user.checkingBalance.toLocaleString()}</strong>
                        </div>
                        <div>
                          <span>Savings:</span>
                          <strong>${user.savingsBalance.toLocaleString()}</strong>
                        </div>
                        <div>
                          <span>Investment:</span>
                          <strong>${user.investmentBalance.toLocaleString()}</strong>
                        </div>
                        <div className={styles.totalBalance}>
                          <span>Total:</span>
                          <strong>
                            ${(user.checkingBalance + user.savingsBalance + user.investmentBalance).toLocaleString()}
                          </strong>
                        </div>
                      </div>
                      
                      {/* User's Recent Transactions */}
                      <div className={styles.userTransactions}>
                        <h4>Recent Transactions:</h4>
                        {getUserTransactions(user._id).slice(0, 3).map(tx => (
                          <div key={tx._id} className={styles.miniTransaction}>
                            <span>{tx.type}</span>
                            <span>${tx.amount}</span>
                            <span className={`${styles.status} ${styles[tx.status]}`}>
                              {tx.status}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUser(user);
                          setActiveTab("credit-debit");
                        }}
                      >
                        Manage Account
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CREDIT/DEBIT TAB */}
          {activeTab === "credit-debit" && selectedUser && (
            <div className={styles.transactionSection}>
              <h2>Credit/Debit Account</h2>
              
              <div className={styles.selectedUserInfo}>
                <h3>{selectedUser.name}</h3>
                <p>{selectedUser.email}</p>
                <div className={styles.currentBalances}>
                  <span>Checking: ${selectedUser.checkingBalance.toLocaleString()}</span>
                  <span>Savings: ${selectedUser.savingsBalance.toLocaleString()}</span>
                  <span>Investment: ${selectedUser.investmentBalance.toLocaleString()}</span>
                </div>
              </div>

              <form onSubmit={handleTransaction} className={styles.transactionForm}>
                <div className={styles.formGroup}>
                  <label>Transaction Type</label>
                  <select
                    value={transactionForm.type}
                    onChange={(e) => setTransactionForm({
                      ...transactionForm, 
                      type: e.target.value,
                      emailType: e.target.value === 'deposit' ? 'credit' : 'debit'
                    })}
                  >
                    <option value="deposit">Deposit (Credit Account)</option>
                    <option value="withdraw">Withdraw (Debit Account)</option>
                    <option value="transfer-in">Transfer In (Credit)</option>
                    <option value="transfer-out">Transfer Out (Debit)</option>
                    <option value="interest">Interest (Credit)</option>
                    <option value="fee">Fee (Debit)</option>
                    <option value="adjustment-credit">Adjustment Credit</option>
                    <option value="adjustment-debit">Adjustment Debit</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Account</label>
                  <select
                    value={transactionForm.accountType}
                    onChange={(e) => setTransactionForm({...transactionForm, accountType: e.target.value})}
                  >
                    <option value="checking">Checking Account</option>
                    <option value="savings">Savings Account</option>
                    <option value="investment">Investment Account</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Amount</label>
                  <input
                    type="number"
                    value={transactionForm.amount}
                    onChange={(e) => setTransactionForm({...transactionForm, amount: e.target.value})}
                    placeholder="0.00"
                    required
                    min="0.01"
                    step="0.01"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Description</label>
                  <input
                    type="text"
                    value={transactionForm.description}
                    onChange={(e) => setTransactionForm({...transactionForm, description: e.target.value})}
                    placeholder="Transaction description"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>
                    <input
                      type="checkbox"
                      checked={transactionForm.sendEmail}
                      onChange={(e) => setTransactionForm({...transactionForm, sendEmail: e.target.checked})}
                    />
                    Send Email Notification
                  </label>
                </div>

                <button type="submit" disabled={loading}>
                  {loading ? "Processing..." : "Execute Transaction"}
                </button>
              </form>
            </div>
          )}

          {/* TRANSACTIONS TAB */}
          {activeTab === "transactions" && (
            <div className={styles.transactionsSection}>
              <h2>All Transactions</h2>
              
              <table className={styles.transactionTable}>
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>User</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Account</th>
                    <th>Description</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx._id}>
                      <td>{tx.reference}</td>
                      <td>{tx.userId?.name || 'Unknown'}</td>
                      <td>{tx.type}</td>
                      <td className={tx.type.includes('deposit') || tx.type.includes('credit') ? styles.credit : styles.debit}>
                        ${tx.amount.toLocaleString()}
                      </td>
                      <td>{tx.accountType}</td>
                      <td>{tx.description}</td>
                      <td>{new Date(tx.date).toLocaleDateString()}</td>
                      <td>
                        <span className={`${styles.status} ${styles[tx.status]}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          {tx.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => approveTransaction(tx._id)}
                                className={styles.approveBtn}
                                disabled={loading}
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => declineTransaction(tx._id)}
                                className={styles.declineBtn}
                                disabled={loading}
                              >
                                Decline
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => startEditTransaction(tx)}
                            className={styles.editBtn}
                            disabled={loading}
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => deleteTransaction(tx._id)}
                            className={styles.deleteBtn}
                            disabled={loading}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* EDIT TRANSACTION TAB */}
          {activeTab === "edit-transaction" && editingTransaction && (
            <div className={styles.editSection}>
              <h2>Edit Transaction</h2>
              
              <div className={styles.editForm}>
                <div className={styles.formGroup}>
                  <label>Reference</label>
                  <input type="text" value={editingTransaction.reference} disabled />
                </div>
                
                <div className={styles.formGroup}>
                  <label>Amount</label>
                  <input
                    type="number"
                    value={editForm.amount}
                    onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                    step="0.01"
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label>Description</label>
                  <input
                    type="text"
                    value={editForm.description}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label>Date</label>
                  <input
                    type="datetime-local"
                    value={editForm.date}
                    onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label>Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                
                <div className={styles.formActions}>
                  <button onClick={saveEditedTransaction} disabled={loading}>
                    Save Changes
                  </button>
                  <button onClick={() => {
                    setEditingTransaction(null);
                    setActiveTab("transactions");
                  }}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}