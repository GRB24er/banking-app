// src/app/transactions/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./transactions.module.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  description: string;
  date: string;
  status: string;
  accountType: string;
  reference?: string;
  channel?: string;
  origin?: string;
  metadata?: any;
  balanceAfter?: number;
}

interface TransactionGroup {
  date: string;
  transactions: Transaction[];
}

export default function TransactionsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [groupedTransactions, setGroupedTransactions] = useState<TransactionGroup[]>([]);
  
  // Filter states
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 20;

  useEffect(() => {
    if (session) {
      fetchTransactions();
    }
  }, [session]);

  useEffect(() => {
    applyFilters();
  }, [transactions, selectedAccount, selectedType, selectedStatus, dateRange, searchTerm]);

  useEffect(() => {
    groupTransactionsByDate();
  }, [filteredTransactions]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/transactions');
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];
    
    // Account filter
    if (selectedAccount !== "all") {
      filtered = filtered.filter(t => t.accountType === selectedAccount);
    }
    
    // Type filter
    if (selectedType !== "all") {
      filtered = filtered.filter(t => t.type === selectedType);
    }
    
    // Status filter
    if (selectedStatus !== "all") {
      filtered = filtered.filter(t => t.status === selectedStatus);
    }
    
    // Date range filter
    if (dateRange !== "all") {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch(dateRange) {
        case "today":
          cutoffDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case "month":
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case "year":
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(t => new Date(t.date) >= cutoffDate);
    }
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.amount.toString().includes(searchTerm)
      );
    }
    
    setFilteredTransactions(filtered);
    setCurrentPage(1);
  };

  const groupTransactionsByDate = () => {
    const groups: { [key: string]: Transaction[] } = {};
    
    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
    });
    
    const groupedArray = Object.keys(groups).map(date => ({
      date,
      transactions: groups[date]
    }));
    
    // Sort by date (newest first)
    groupedArray.sort((a, b) => {
      return new Date(b.transactions[0].date).getTime() - new Date(a.transactions[0].date).getTime();
    });
    
    setGroupedTransactions(groupedArray);
  };

  // CRITICAL FIX: Properly format amount based on transaction type
  const formatTransactionAmount = (transaction: Transaction): string => {
    const amount = Math.abs(transaction.amount);
    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
    
    // Determine if this is a debit or credit
    const isDebit = [
      'transfer-out', 
      'withdrawal', 
      'payment', 
      'fee', 
      'charge',
      'purchase',
      'external_transfer',
      'wire_transfer',
      'international_transfer'
    ].includes(transaction.type) || 
    (transaction.origin && ['external_transfer', 'wire_transfer', 'international_transfer'].includes(transaction.origin));
    
    // For internal transfers, check if it's the outgoing side
    if (transaction.type === 'transfer-out' || 
        (transaction.origin === 'internal_transfer' && transaction.reference?.includes('-OUT'))) {
      return `-${formattedAmount}`;
    }
    
    if (transaction.type === 'transfer-in' || 
        (transaction.origin === 'internal_transfer' && transaction.reference?.includes('-IN'))) {
      return `+${formattedAmount}`;
    }
    
    // Default behavior
    return isDebit ? `-${formattedAmount}` : `+${formattedAmount}`;
  };

  const getTransactionIcon = (type: string): string => {
    const iconMap: { [key: string]: string } = {
      'deposit': '⬇️',
      'withdrawal': '⬆️',
      'transfer-in': '📥',
      'transfer-out': '📤',
      'payment': '💳',
      'fee': '💵',
      'interest': '💰',
      'refund': '↩️',
      'purchase': '🛒',
      'charge': '📝'
    };
    return iconMap[type] || '📄';
  };

  const getTransactionColor = (transaction: Transaction): string => {
    // Check if it's a debit (money going out)
    const isDebit = [
      'transfer-out', 
      'withdrawal', 
      'payment', 
      'fee', 
      'charge',
      'purchase'
    ].includes(transaction.type) || 
    (transaction.origin && ['external_transfer', 'wire_transfer', 'international_transfer'].includes(transaction.origin));
    
    if (transaction.type === 'transfer-out' || 
        (transaction.origin === 'internal_transfer' && transaction.reference?.includes('-OUT'))) {
      return styles.debit;
    }
    
    if (transaction.type === 'transfer-in' || 
        (transaction.origin === 'internal_transfer' && transaction.reference?.includes('-IN'))) {
      return styles.credit;
    }
    
    return isDebit ? styles.debit : styles.credit;
  };

  const getStatusBadge = (status: string) => {
    const statusStyles: { [key: string]: string } = {
      'completed': styles.statusCompleted,
      'pending': styles.statusPending,
      'failed': styles.statusFailed,
      'processing': styles.statusProcessing
    };
    
    return (
      <span className={`${styles.statusBadge} ${statusStyles[status] || ''}`}>
        {status}
      </span>
    );
  };

  // Pagination
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstTransaction, indexOfLastTransaction);
  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Calculate totals
  const calculateTotals = () => {
    let totalIn = 0;
    let totalOut = 0;
    
    filteredTransactions.forEach(t => {
      const amount = Math.abs(t.amount);
      
      // Determine if money is coming in or going out
      if (t.type === 'transfer-out' || 
          t.type === 'withdrawal' || 
          t.type === 'payment' || 
          t.type === 'fee' || 
          t.type === 'charge' ||
          t.type === 'purchase' ||
          (t.origin && ['external_transfer', 'wire_transfer', 'international_transfer'].includes(t.origin) && !t.type.includes('in'))) {
        totalOut += amount;
      } else if (t.type === 'transfer-in' || 
                 t.type === 'deposit' || 
                 t.type === 'interest' || 
                 t.type === 'refund') {
        totalIn += amount;
      }
    });
    
    return { totalIn, totalOut, net: totalIn - totalOut };
  };

  const totals = calculateTotals();

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <Sidebar />
        <div className={styles.main}>
          <Header />
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
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
            <div>
              <h1>Transaction History</h1>
              <p>View and manage your transaction history</p>
            </div>
            <button 
              className={styles.downloadBtn}
              onClick={() => {
                // Export functionality
                const csv = filteredTransactions.map(t => 
                  `${t.date},${t.type},${t.description},${formatTransactionAmount(t)},${t.status}`
                ).join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'transactions.csv';
                a.click();
              }}
            >
              📥 Export CSV
            </button>
          </div>

          {/* Summary Cards */}
          <div className={styles.summaryCards}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryIcon}>📥</div>
              <div className={styles.summaryContent}>
                <span className={styles.summaryLabel}>Total Inflow</span>
                <span className={`${styles.summaryAmount} ${styles.credit}`}>
                  +${totals.totalIn.toFixed(2)}
                </span>
              </div>
            </div>
            
            <div className={styles.summaryCard}>
              <div className={styles.summaryIcon}>📤</div>
              <div className={styles.summaryContent}>
                <span className={styles.summaryLabel}>Total Outflow</span>
                <span className={`${styles.summaryAmount} ${styles.debit}`}>
                  -${totals.totalOut.toFixed(2)}
                </span>
              </div>
            </div>
            
            <div className={styles.summaryCard}>
              <div className={styles.summaryIcon}>💰</div>
              <div className={styles.summaryContent}>
                <span className={styles.summaryLabel}>Net Change</span>
                <span className={`${styles.summaryAmount} ${totals.net >= 0 ? styles.credit : styles.debit}`}>
                  {totals.net >= 0 ? '+' : ''} ${Math.abs(totals.net).toFixed(2)}
                </span>
              </div>
            </div>
            
            <div className={styles.summaryCard}>
              <div className={styles.summaryIcon}>📊</div>
              <div className={styles.summaryContent}>
                <span className={styles.summaryLabel}>Total Transactions</span>
                <span className={styles.summaryAmount}>{filteredTransactions.length}</span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className={styles.filters}>
            <div className={styles.filterGroup}>
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            
            <div className={styles.filterGroup}>
              <select 
                value={selectedAccount} 
                onChange={(e) => setSelectedAccount(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">All Accounts</option>
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
                <option value="investment">Investment</option>
              </select>
            </div>
            
            <div className={styles.filterGroup}>
              <select 
                value={selectedType} 
                onChange={(e) => setSelectedType(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">All Types</option>
                <option value="deposit">Deposits</option>
                <option value="withdrawal">Withdrawals</option>
                <option value="transfer-in">Transfers In</option>
                <option value="transfer-out">Transfers Out</option>
                <option value="payment">Payments</option>
                <option value="fee">Fees</option>
              </select>
            </div>
            
            <div className={styles.filterGroup}>
              <select 
                value={selectedStatus} 
                onChange={(e) => setSelectedStatus(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            
            <div className={styles.filterGroup}>
              <select 
                value={dateRange} 
                onChange={(e) => setDateRange(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="year">Last Year</option>
              </select>
            </div>
          </div>

          {/* Transactions List */}
          <div className={styles.transactionsList}>
            {groupedTransactions.length === 0 ? (
              <div className={styles.noTransactions}>
                <span className={styles.noTransactionsIcon}>📭</span>
                <h3>No transactions found</h3>
                <p>Try adjusting your filters or make your first transaction</p>
              </div>
            ) : (
              groupedTransactions.map((group) => (
                <div key={group.date} className={styles.transactionGroup}>
                  <div className={styles.dateHeader}>
                    <span>{group.date}</span>
                    <span className={styles.dateCount}>{group.transactions.length} transactions</span>
                  </div>
                  
                  {group.transactions.map((transaction) => (
                    <div 
                      key={transaction._id} 
                      className={styles.transactionItem}
                      onClick={() => {
                        // View transaction details
                        console.log('View transaction:', transaction);
                      }}
                    >
                      <div className={styles.transactionLeft}>
                        <span className={styles.transactionIcon}>
                          {getTransactionIcon(transaction.type)}
                        </span>
                        <div className={styles.transactionDetails}>
                          <div className={styles.transactionDescription}>
                            {transaction.description}
                          </div>
                          <div className={styles.transactionMeta}>
                            <span className={styles.transactionType}>{transaction.type}</span>
                            {transaction.reference && (
                              <>
                                <span className={styles.separator}>•</span>
                                <span className={styles.transactionRef}>Ref: {transaction.reference}</span>
                              </>
                            )}
                            <span className={styles.separator}>•</span>
                            <span className={styles.transactionAccount}>{transaction.accountType}</span>
                            {transaction.channel && (
                              <>
                                <span className={styles.separator}>•</span>
                                <span className={styles.transactionChannel}>{transaction.channel}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className={styles.transactionRight}>
                        <span className={`${styles.transactionAmount} ${getTransactionColor(transaction)}`}>
                          {formatTransactionAmount(transaction)}
                        </span>
                        {getStatusBadge(transaction.status)}
                        {transaction.balanceAfter !== undefined && (
                          <div className={styles.balanceAfter}>
                            Balance: ${transaction.balanceAfter.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button 
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className={styles.paginationBtn}
              >
                Previous
              </button>
              
              <div className={styles.pageNumbers}>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => paginate(pageNum)}
                      className={`${styles.pageNumber} ${currentPage === pageNum ? styles.active : ''}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button 
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={styles.paginationBtn}
              >
                Next
              </button>
            </div>
          )}
        </div>
        
        <Footer />
      </div>
    </div>
  );
}
