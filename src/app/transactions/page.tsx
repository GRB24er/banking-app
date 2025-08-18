"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import styles from "./transactions.module.css";

interface Transaction {
  _id: string;
  reference: string;
  description: string;
  amount: number;
  status: string;
  date: string;
  accountType: string;
  type: string;
}

export default function TransactionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState("all");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    
    if (status === "authenticated") {
      fetchTransactions();
    }
  }, [status, router]);

  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/user/transactions");
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    // Status filter
    if (filter !== "all" && tx.status !== filter) return false;
    
    // Search filter
    if (searchTerm && !tx.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !tx.reference.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Date filter
    if (dateRange !== "all") {
      const txDate = new Date(tx.date);
      const now = new Date();
      const daysDiff = (now.getTime() - txDate.getTime()) / (1000 * 3600 * 24);
      
      if (dateRange === "week" && daysDiff > 7) return false;
      if (dateRange === "month" && daysDiff > 30) return false;
      if (dateRange === "year" && daysDiff > 365) return false;
    }
    
    return true;
  });

  // Calculate statistics
  const stats = {
    total: filteredTransactions.length,
    pending: filteredTransactions.filter(tx => tx.status === "pending").length,
    completed: filteredTransactions.filter(tx => tx.status === "completed").length,
    totalAmount: filteredTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
  };

  const formatAmount = (amount: number, type: string) => {
    const prefix = type === "deposit" || type === "interest" ? "+" : "-";
    return `${prefix}$${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (d.toDateString() === today.toDateString()) {
      return `Today at ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (d.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return styles.statusCompleted;
      case 'pending': return styles.statusPending;
      case 'rejected': return styles.statusRejected;
      default: return styles.statusDefault;
    }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'deposit': return '⬇️';
      case 'withdraw': return '⬆️';
      case 'transfer-in': return '📥';
      case 'transfer-out': return '📤';
      case 'interest': return '💰';
      case 'fee': return '💳';
      default: return '💵';
    }
  };

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <Sidebar />
        <div className={styles.main}>
          <Header />
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading transactions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <Sidebar />
      <div className={styles.main}>
        <Header />
        
        <div className={styles.content}>
          {/* Page Header */}
          <div className={styles.pageHeader}>
            <div className={styles.headerLeft}>
              <h1>Transaction History</h1>
              <p>View and manage all your transactions</p>
            </div>
            <div className={styles.headerRight}>
              <button 
                className={styles.exportButton}
                onClick={() => alert('Export functionality coming soon')}
              >
                📥 Export
              </button>
              <button 
                className={styles.printButton}
                onClick={() => window.print()}
              >
                🖨️ Print
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>📊</div>
              <div className={styles.statContent}>
                <div className={styles.statLabel}>Total Transactions</div>
                <div className={styles.statValue}>{stats.total}</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>⏳</div>
              <div className={styles.statContent}>
                <div className={styles.statLabel}>Pending</div>
                <div className={styles.statValue}>{stats.pending}</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>✅</div>
              <div className={styles.statContent}>
                <div className={styles.statLabel}>Completed</div>
                <div className={styles.statValue}>{stats.completed}</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>💵</div>
              <div className={styles.statContent}>
                <div className={styles.statLabel}>Total Volume</div>
                <div className={styles.statValue}>
                  ${stats.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className={styles.filtersSection}>
            <div className={styles.searchBox}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.filterButtons}>
              <select 
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className={styles.dateSelect}
              >
                <option value="all">All Time</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="year">Last Year</option>
              </select>

              <div className={styles.statusFilters}>
                <button 
                  className={filter === "all" ? styles.filterActive : ""}
                  onClick={() => setFilter("all")}
                >
                  All
                </button>
                <button 
                  className={filter === "pending" ? styles.filterActive : ""}
                  onClick={() => setFilter("pending")}
                >
                  Pending
                </button>
                <button 
                  className={filter === "completed" ? styles.filterActive : ""}
                  onClick={() => setFilter("completed")}
                >
                  Completed
                </button>
                <button 
                  className={filter === "rejected" ? styles.filterActive : ""}
                  onClick={() => setFilter("rejected")}
                >
                  Rejected
                </button>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className={styles.transactionsContainer}>
            {filteredTransactions.length === 0 ? (
              <div className={styles.noTransactions}>
                <div className={styles.noTransactionsIcon}>📭</div>
                <h3>No transactions found</h3>
                <p>Try adjusting your filters or search criteria</p>
              </div>
            ) : (
              <div className={styles.transactionsList}>
                {filteredTransactions.map((tx) => (
                  <div key={tx._id} className={styles.transactionCard}>
                    <div className={styles.transactionLeft}>
                      <div className={styles.transactionIcon}>
                        {getTypeIcon(tx.type)}
                      </div>
                      <div className={styles.transactionInfo}>
                        <h4>{tx.description}</h4>
                        <div className={styles.transactionMeta}>
                          <span className={styles.reference}>Ref: {tx.reference}</span>
                          <span className={styles.separator}>•</span>
                          <span className={styles.account}>{tx.accountType}</span>
                          <span className={styles.separator}>•</span>
                          <span className={styles.date}>{formatDate(tx.date)}</span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.transactionRight}>
                      <div className={`${styles.amount} ${tx.type === 'deposit' || tx.type === 'interest' ? styles.credit : styles.debit}`}>
                        {formatAmount(tx.amount, tx.type)}
                      </div>
                      <span className={`${styles.status} ${getStatusColor(tx.status)}`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
