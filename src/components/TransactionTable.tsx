// components/TransactionTable.tsx
"use client";

import React, { useState, useMemo } from "react";
import styles from "./TransactionTable.module.css";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  status: "Completed" | "Pending" | "Failed" | "Processing" | "Cancelled";
  date: string;
  category: string;
  type?: "credit" | "debit";
  merchantLogo?: string;
  reference?: string;
  method?: string;
  balance?: number;
}

interface TransactionTableProps {
  transactions?: Transaction[];
  showFilters?: boolean;
  showExport?: boolean;
  title?: string;
  maxHeight?: string;
}

export default function TransactionTable({ 
  transactions = [], 
  showFilters = false,
  showExport = false,
  title = "Recent Transactions",
  maxHeight = "600px"
}: TransactionTableProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | Transaction["status"]>("all");
  const [filterType, setFilterType] = useState<"all" | "credit" | "debit">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Filter and sort transactions
  const processedTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(t => t.status === filterStatus);
    }

    // Apply type filter
    if (filterType !== "all") {
      filtered = filtered.filter(t => {
        const isCredit = t.amount > 0;
        return filterType === "credit" ? isCredit : !isCredit;
      });
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query) ||
        t.id.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "date") {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === "amount") {
        comparison = Math.abs(a.amount) - Math.abs(b.amount);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [transactions, filterStatus, filterType, searchQuery, sortBy, sortOrder]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = processedTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const credits = processedTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const debits = processedTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const pending = processedTransactions.filter(t => t.status === "Pending").length;
    
    return { total, credits, debits, pending };
  }, [processedTransactions]);

  const exportToCSV = () => {
    const headers = ["Date", "Description", "Category", "Amount", "Status", "Reference"];
    const rows = processedTransactions.map(t => [
      new Date(t.date).toLocaleDateString(),
      t.description,
      t.category,
      t.amount.toFixed(2),
      t.status,
      t.reference || t.id
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusIcon = (status: Transaction["status"]) => {
    switch(status) {
      case "Completed": return "✓";
      case "Pending": return "⏳";
      case "Processing": return "⚡";
      case "Failed": return "✕";
      case "Cancelled": return "⊘";
      default: return "•";
    }
  };

  const getTransactionIcon = (category: string, amount: number) => {
    const isCredit = amount > 0;
    if (category.toLowerCase().includes("salary") || category.toLowerCase().includes("deposit")) return "💰";
    if (category.toLowerCase().includes("shopping")) return "🛍️";
    if (category.toLowerCase().includes("food") || category.toLowerCase().includes("restaurant")) return "🍽️";
    if (category.toLowerCase().includes("transport")) return "🚗";
    if (category.toLowerCase().includes("bill")) return "📱";
    if (category.toLowerCase().includes("investment")) return "📈";
    if (category.toLowerCase().includes("transfer")) return isCredit ? "📥" : "📤";
    return isCredit ? "📥" : "📤";
  };

  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.subtitle}>
            Showing {processedTransactions.length} of {transactions.length} transactions
          </p>
        </div>
        
        <div className={styles.headerRight}>
          <div className={styles.viewToggle}>
            <button 
              className={`${styles.viewButton} ${viewMode === "table" ? styles.active : ""}`}
              onClick={() => setViewMode("table")}
              aria-label="Table view"
            >
              ☰
            </button>
            <button 
              className={`${styles.viewButton} ${viewMode === "cards" ? styles.active : ""}`}
              onClick={() => setViewMode("cards")}
              aria-label="Card view"
            >
              ⊞
            </button>
          </div>
          
          {showExport && (
            <button className={styles.exportButton} onClick={exportToCSV}>
              📊 Export CSV
            </button>
          )}
          
          <Link href="/transactions" className={styles.viewAllButton}>
            View All →
          </Link>
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <div className={styles.filters}>
          <div className={styles.searchBar}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className={styles.filterSelect}
          >
            <option value="all">All Status</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Failed">Failed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className={styles.filterSelect}
          >
            <option value="all">All Types</option>
            <option value="credit">Credits Only</option>
            <option value="debit">Debits Only</option>
          </select>
          
          <select 
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split("-");
              setSortBy(field as any);
              setSortOrder(order as any);
            }}
            className={styles.filterSelect}
          >
            <option value="date-desc">Latest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amount-desc">Highest Amount</option>
            <option value="amount-asc">Lowest Amount</option>
          </select>
        </div>
      )}

      {/* Statistics Cards */}
      <div className={styles.statsCards}>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>💵</span>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Total Volume</span>
            <span className={styles.statValue}>
              ${stats.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <span className={styles.statIcon} style={{ color: '#10b981' }}>📥</span>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Total Credits</span>
            <span className={styles.statValue} style={{ color: '#10b981' }}>
              +${stats.credits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <span className={styles.statIcon} style={{ color: '#ef4444' }}>📤</span>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Total Debits</span>
            <span className={styles.statValue} style={{ color: '#ef4444' }}>
              -${stats.debits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <span className={styles.statIcon} style={{ color: '#f59e0b' }}>⏳</span>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Pending</span>
            <span className={styles.statValue} style={{ color: '#f59e0b' }}>
              {stats.pending} transactions
            </span>
          </div>
        </div>
      </div>

      {/* Transactions Display */}
      <div className={styles.tableWrapper} style={{ maxHeight }}>
        {viewMode === "table" ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.thCheckbox}>
                  <input type="checkbox" className={styles.checkbox} />
                </th>
                <th className={styles.thTransaction}>Transaction</th>
                <th className={styles.thAmount}>Amount</th>
                <th className={styles.thStatus}>Status</th>
                <th className={styles.thDate}>Date & Time</th>
                <th className={styles.thBalance}>Balance</th>
                <th className={styles.thActions}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {processedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyState}>
                    <div className={styles.emptyContent}>
                      <span className={styles.emptyIcon}>📭</span>
                      <p className={styles.emptyText}>No transactions found</p>
                      <p className={styles.emptySubtext}>
                        Try adjusting your filters or search query
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                processedTransactions.map((transaction, index) => {
                  const isCredit = transaction.amount > 0;
                  const isSelected = selectedTransaction === transaction.id;
                  
                  return (
                    <React.Fragment key={transaction.id}>
                      <tr 
                        className={`${styles.row} ${isSelected ? styles.selected : ''}`}
                        onClick={() => setSelectedTransaction(isSelected ? null : transaction.id)}
                      >
                        <td className={styles.tdCheckbox}>
                          <input 
                            type="checkbox" 
                            className={styles.checkbox}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td className={styles.tdTransaction}>
                          <div className={styles.transactionCell}>
                            <div className={styles.transactionIcon}>
                              {getTransactionIcon(transaction.category, transaction.amount)}
                            </div>
                            <div className={styles.transactionDetails}>
                              <span className={styles.transactionName}>
                                {transaction.description}
                              </span>
                              <span className={styles.transactionCategory}>
                                {transaction.category} • {transaction.method || "Online"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className={`${styles.tdAmount} ${isCredit ? styles.credit : styles.debit}`}>
                          <span className={styles.amountValue}>
                            {isCredit ? '+' : '-'}${Math.abs(transaction.amount).toLocaleString('en-US', { 
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </span>
                        </td>
                        <td className={styles.tdStatus}>
                          <span className={`${styles.statusBadge} ${styles[`status${transaction.status}`]}`}>
                            <span className={styles.statusIcon}>
                              {getStatusIcon(transaction.status)}
                            </span>
                            {transaction.status}
                          </span>
                        </td>
                        <td className={styles.tdDate}>
                          <div className={styles.dateCell}>
                            <span className={styles.date}>
                              {new Date(transaction.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                            <span className={styles.time}>
                              {new Date(transaction.date).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </td>
                        <td className={styles.tdBalance}>
                          <span className={styles.balanceValue}>
                            ${(transaction.balance || 0).toLocaleString('en-US', { 
                              minimumFractionDigits: 2 
                            })}
                          </span>
                        </td>
                        <td className={styles.tdActions}>
                          <button 
                            className={styles.actionButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('View details:', transaction.id);
                            }}
                          >
                            •••
                          </button>
                        </td>
                      </tr>
                      
                      {/* Expanded Details Row */}
                      <AnimatePresence>
                        {isSelected && (
                          <tr className={styles.expandedRow}>
                            <td colSpan={7}>
                              <motion.div 
                                className={styles.expandedContent}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <div className={styles.expandedGrid}>
                                  <div className={styles.expandedSection}>
                                    <h4>Transaction Details</h4>
                                    <div className={styles.detailRow}>
                                      <span className={styles.detailLabel}>Reference ID:</span>
                                      <span className={styles.detailValue}>
                                        {transaction.reference || transaction.id}
                                      </span>
                                    </div>
                                    <div className={styles.detailRow}>
                                      <span className={styles.detailLabel}>Payment Method:</span>
                                      <span className={styles.detailValue}>
                                        {transaction.method || "Bank Transfer"}
                                      </span>
                                    </div>
                                    <div className={styles.detailRow}>
                                      <span className={styles.detailLabel}>Processing Time:</span>
                                      <span className={styles.detailValue}>1-2 business days</span>
                                    </div>
                                  </div>
                                  
                                  <div className={styles.expandedSection}>
                                    <h4>Actions</h4>
                                    <div className={styles.expandedActions}>
                                      <button className={styles.expandedButton}>
                                        📄 Download Receipt
                                      </button>
                                      <button className={styles.expandedButton}>
                                        🔄 Dispute Transaction
                                      </button>
                                      <button className={styles.expandedButton}>
                                        📧 Email Details
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        ) : (
          <div className={styles.cardsGrid}>
            {processedTransactions.map((transaction) => {
              const isCredit = transaction.amount > 0;
              
              return (
                <motion.div 
                  key={transaction.id}
                  className={styles.transactionCard}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={styles.cardHeader}>
                    <div className={styles.cardIcon}>
                      {getTransactionIcon(transaction.category, transaction.amount)}
                    </div>
                    <span className={`${styles.cardStatus} ${styles[`status${transaction.status}`]}`}>
                      {transaction.status}
                    </span>
                  </div>
                  
                  <div className={styles.cardBody}>
                    <h4 className={styles.cardTitle}>{transaction.description}</h4>
                    <p className={styles.cardCategory}>{transaction.category}</p>
                    
                    <div className={`${styles.cardAmount} ${isCredit ? styles.credit : styles.debit}`}>
                      {isCredit ? '+' : '-'}${Math.abs(transaction.amount).toLocaleString('en-US', { 
                        minimumFractionDigits: 2 
                      })}
                    </div>
                    
                    <div className={styles.cardFooter}>
                      <span className={styles.cardDate}>
                        {new Date(transaction.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      <button className={styles.cardAction}>View Details →</button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {processedTransactions.length > 10 && (
        <div className={styles.pagination}>
          <button className={styles.paginationButton}>← Previous</button>
          <div className={styles.paginationNumbers}>
            <button className={`${styles.pageNumber} ${styles.active}`}>1</button>
            <button className={styles.pageNumber}>2</button>
            <button className={styles.pageNumber}>3</button>
            <span className={styles.paginationEllipsis}>...</span>
            <button className={styles.pageNumber}>10</button>
          </div>
          <button className={styles.paginationButton}>Next →</button>
        </div>
      )}
    </motion.div>
  );
}