"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import styles from "./bills.module.css";

interface Bill {
  id: number;
  payee: string;
  accountNumber: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'scheduled' | 'pending' | 'overdue';
  category: string;
  lastPaid?: string;
  autopay: boolean;
}

export default function BillsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedBills, setSelectedBills] = useState<number[]>([]);
  const [showAddPayee, setShowAddPayee] = useState(false);

  const bills: Bill[] = [
    {
      id: 1,
      payee: "Pacific Gas & Electric",
      accountNumber: "****4782",
      amount: 125.50,
      dueDate: "2025-08-25",
      status: 'pending',
      category: 'Utilities',
      lastPaid: "2025-07-25",
      autopay: true
    },
    {
      id: 2,
      payee: "Comcast Internet",
      accountNumber: "****9301",
      amount: 79.99,
      dueDate: "2025-08-28",
      status: 'scheduled',
      category: 'Internet',
      lastPaid: "2025-07-28",
      autopay: true
    },
    {
      id: 3,
      payee: "City Water Department",
      accountNumber: "****5624",
      amount: 45.30,
      dueDate: "2025-08-30",
      status: 'pending',
      category: 'Utilities',
      lastPaid: "2025-07-30",
      autopay: false
    },
    {
      id: 4,
      payee: "Verizon Wireless",
      accountNumber: "****8923",
      amount: 85.00,
      dueDate: "2025-09-01",
      status: 'pending',
      category: 'Phone',
      lastPaid: "2025-08-01",
      autopay: true
    },
    {
      id: 5,
      payee: "State Farm Insurance",
      accountNumber: "****3467",
      amount: 250.00,
      dueDate: "2025-09-05",
      status: 'pending',
      category: 'Insurance',
      lastPaid: "2025-08-05",
      autopay: false
    }
  ];

  const totalDue = bills.reduce((sum, bill) => 
    bill.status === 'pending' ? sum + bill.amount : sum, 0
  );

  const handleSelectBill = (id: number) => {
    setSelectedBills(prev => 
      prev.includes(id) 
        ? prev.filter(billId => billId !== id)
        : [...prev, id]
    );
  };

  const handlePaySelected = () => {
    if (selectedBills.length === 0) {
      alert('Please select bills to pay');
      return;
    }
    const total = bills
      .filter(bill => selectedBills.includes(bill.id))
      .reduce((sum, bill) => sum + bill.amount, 0);
    
    if (confirm(`Pay ${selectedBills.length} bill(s) totaling $${total.toFixed(2)}?`)) {
      // Process payment
      alert('Payment initiated successfully');
      setSelectedBills([]);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      paid: { bg: '#dcfce7', color: '#16a34a', text: 'Paid' },
      scheduled: { bg: '#fef3c7', color: '#d97706', text: 'Scheduled' },
      pending: { bg: '#dbeafe', color: '#2563eb', text: 'Due Soon' },
      overdue: { bg: '#fee2e2', color: '#dc2626', text: 'Overdue' }
    };
    const style = statusStyles[status as keyof typeof statusStyles];
    return (
      <span style={{
        padding: '0.25rem 0.75rem',
        borderRadius: '20px',
        fontSize: '0.75rem',
        fontWeight: '600',
        background: style.bg,
        color: style.color
      }}>
        {style.text}
      </span>
    );
  };

  return (
    <div className={styles.wrapper}>
      <Sidebar />
      <div className={styles.main}>
        <Header />
        
        <div className={styles.content}>
          {/* Page Header */}
          <div className={styles.pageHeader}>
            <div className={styles.headerLeft}>
              <h1>Bill Pay Center</h1>
              <p>Manage and pay your bills securely in one place</p>
            </div>
            <div className={styles.headerRight}>
              <button 
                className={styles.addPayeeBtn}
                onClick={() => setShowAddPayee(true)}
              >
                <span>+</span> Add Payee
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className={styles.summaryCards}>
            <div className={styles.summaryCard}>
              <div className={styles.cardIcon} style={{ background: '#dbeafe' }}>
                <span style={{ fontSize: '1.5rem' }}>📋</span>
              </div>
              <div className={styles.cardContent}>
                <div className={styles.cardLabel}>Total Due</div>
                <div className={styles.cardValue}>${totalDue.toFixed(2)}</div>
                <div className={styles.cardSubtext}>This month</div>
              </div>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.cardIcon} style={{ background: '#dcfce7' }}>
                <span style={{ fontSize: '1.5rem' }}>✅</span>
              </div>
              <div className={styles.cardContent}>
                <div className={styles.cardLabel}>Auto-Pay Active</div>
                <div className={styles.cardValue}>
                  {bills.filter(b => b.autopay).length}
                </div>
                <div className={styles.cardSubtext}>Payees</div>
              </div>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.cardIcon} style={{ background: '#fef3c7' }}>
                <span style={{ fontSize: '1.5rem' }}>⏰</span>
              </div>
              <div className={styles.cardContent}>
                <div className={styles.cardLabel}>Upcoming</div>
                <div className={styles.cardValue}>
                  {bills.filter(b => b.status === 'pending').length}
                </div>
                <div className={styles.cardSubtext}>Bills</div>
              </div>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.cardIcon} style={{ background: '#f3e8ff' }}>
                <span style={{ fontSize: '1.5rem' }}>📅</span>
              </div>
              <div className={styles.cardContent}>
                <div className={styles.cardLabel}>Next Due</div>
                <div className={styles.cardValue}>Aug 25</div>
                <div className={styles.cardSubtext}>In 7 days</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className={styles.tabs}>
            <button 
              className={activeTab === 'upcoming' ? styles.activeTab : ''}
              onClick={() => setActiveTab('upcoming')}
            >
              Upcoming Bills
            </button>
            <button 
              className={activeTab === 'scheduled' ? styles.activeTab : ''}
              onClick={() => setActiveTab('scheduled')}
            >
              Scheduled
            </button>
            <button 
              className={activeTab === 'history' ? styles.activeTab : ''}
              onClick={() => setActiveTab('history')}
            >
              Payment History
            </button>
            <button 
              className={activeTab === 'payees' ? styles.activeTab : ''}
              onClick={() => setActiveTab('payees')}
            >
              Manage Payees
            </button>
          </div>

          {/* Bills Table */}
          <div className={styles.billsContainer}>
            {selectedBills.length > 0 && (
              <div className={styles.selectionBar}>
                <span>{selectedBills.length} bill(s) selected</span>
                <div className={styles.selectionActions}>
                  <span className={styles.selectedTotal}>
                    Total: ${bills
                      .filter(bill => selectedBills.includes(bill.id))
                      .reduce((sum, bill) => sum + bill.amount, 0)
                      .toFixed(2)}
                  </span>
                  <button 
                    className={styles.paySelectedBtn}
                    onClick={handlePaySelected}
                  >
                    Pay Selected
                  </button>
                  <button 
                    className={styles.clearBtn}
                    onClick={() => setSelectedBills([])}
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            <div className={styles.billsTable}>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input 
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBills(bills.map(b => b.id));
                          } else {
                            setSelectedBills([]);
                          }
                        }}
                        checked={selectedBills.length === bills.length}
                      />
                    </th>
                    <th>Payee</th>
                    <th>Account</th>
                    <th>Amount</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Auto-Pay</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map(bill => (
                    <tr key={bill.id}>
                      <td>
                        <input 
                          type="checkbox"
                          checked={selectedBills.includes(bill.id)}
                          onChange={() => handleSelectBill(bill.id)}
                        />
                      </td>
                      <td>
                        <div className={styles.payeeInfo}>
                          <div className={styles.payeeName}>{bill.payee}</div>
                          <div className={styles.payeeCategory}>{bill.category}</div>
                        </div>
                      </td>
                      <td className={styles.accountNumber}>{bill.accountNumber}</td>
                      <td className={styles.amount}>${bill.amount.toFixed(2)}</td>
                      <td>
                        <div className={styles.dueDate}>
                          {new Date(bill.dueDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </td>
                      <td>{getStatusBadge(bill.status)}</td>
                      <td>
                        <div className={styles.autopayToggle}>
                          <label className={styles.switch}>
                            <input type="checkbox" defaultChecked={bill.autopay} />
                            <span className={styles.slider}></span>
                          </label>
                        </div>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <button className={styles.actionBtn}>Pay Now</button>
                          <button className={styles.moreBtn}>⋮</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}