"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import AdminSidebar from "@/components/AdminSidebar";
import styles from "../cards/adminCards.module.css";

interface LoanApplication {
  _id: string;
  applicationNumber: string;
  userId: any;
  userEmail: string;
  userName: string;
  loanType: string;
  amount: number;
  term: number;
  interestRate: number;
  monthlyPayment: number;
  totalRepayment: number;
  purpose: string;
  employmentStatus: string;
  monthlyIncome: number;
  status: string;
  createdAt: string;
  approvedAmount?: number;
  approvedRate?: number;
  rejectionReason?: string;
}

export default function AdminLoansPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [filter, setFilter] = useState("submitted");
  const [selectedLoan, setSelectedLoan] = useState<LoanApplication | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [approveForm, setApproveForm] = useState({
    approvedAmount: "",
    approvedRate: "",
    approvedTerm: "",
    conditions: "",
  });

  useEffect(() => {
    if (status === "authenticated") {
      fetchLoans();
    }
  }, [status, filter]);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const url = filter ? `/api/admin/loans?status=${filter}` : "/api/admin/loans";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setLoans(data.applications || []);
      }
    } catch (err) {
      console.error("Error fetching loans:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedLoan) return;

    setProcessing(true);
    try {
      const res = await fetch("/api/admin/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          applicationId: selectedLoan._id,
          approvedAmount: parseFloat(approveForm.approvedAmount) || selectedLoan.amount,
          approvedRate: parseFloat(approveForm.approvedRate) || selectedLoan.interestRate,
          approvedTerm: parseInt(approveForm.approvedTerm) || selectedLoan.term,
          conditions: approveForm.conditions ? approveForm.conditions.split("\n") : [],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Loan approved! User has been notified." });
        setShowApproveModal(false);
        setSelectedLoan(null);
        fetchLoans();
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (loanId: string) => {
    const reason = prompt("Please provide rejection reason:");
    if (!reason) return;

    setProcessing(true);
    try {
      const res = await fetch("/api/admin/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", applicationId: loanId, rejectionReason: reason }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Loan rejected" });
        fetchLoans();
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setProcessing(false);
    }
  };

  const handleDisburse = async (loanId: string) => {
    const account = prompt("Enter disbursement account (checking/savings):", "checking");
    if (!account) return;

    setProcessing(true);
    try {
      const res = await fetch("/api/admin/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "disburse",
          applicationId: loanId,
          disbursementAccount: account,
          disbursementReference: `LOAN-${Date.now()}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Loan disbursed! Funds added to user account." });
        fetchLoans();
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "#10b981";
      case "disbursed": return "#10b981";
      case "submitted": return "#f59e0b";
      case "under_review": return "#3b82f6";
      case "rejected": return "#ef4444";
      default: return "#6b7280";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  };

  return (
    <div className={styles.wrapper}>
      <AdminSidebar />
      <div className={styles.main}>
        <div className={styles.header}>
          <h1>Loan Applications</h1>
          <p>Review and manage loan applications</p>
        </div>

        {message.text && (
          <div className={`${styles.message} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}

        <div className={styles.filters}>
          {["submitted", "under_review", "approved", "disbursed", "rejected", ""].map((f) => (
            <button
              key={f || "all"}
              className={filter === f ? styles.active : ""}
              onClick={() => setFilter(f)}
            >
              {f ? f.replace("_", " ").charAt(0).toUpperCase() + f.slice(1).replace("_", " ") : "All"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className={styles.loading}>Loading loans...</div>
        ) : loans.length === 0 ? (
          <div className={styles.empty}>No loan applications found</div>
        ) : (
          <div className={styles.cardsTable}>
            <table>
              <thead>
                <tr>
                  <th>Application #</th>
                  <th>User</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Term</th>
                  <th>Rate</th>
                  <th>Monthly</th>
                  <th>Income</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan) => (
                  <tr key={loan._id}>
                    <td className={styles.reference}>{loan.applicationNumber}</td>
                    <td>
                      <div>{loan.userName}</div>
                      <small>{loan.userEmail}</small>
                    </td>
                    <td>{loan.loanType}</td>
                    <td>{formatCurrency(loan.approvedAmount || loan.amount)}</td>
                    <td>{loan.term} mo</td>
                    <td>{loan.approvedRate || loan.interestRate}%</td>
                    <td>{formatCurrency(loan.monthlyPayment)}</td>
                    <td>{formatCurrency(loan.monthlyIncome)}</td>
                    <td>
                      <span
                        className={styles.status}
                        style={{ background: getStatusColor(loan.status) }}
                      >
                        {loan.status.replace("_", " ")}
                      </span>
                    </td>
                    <td>{new Date(loan.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className={styles.actions}>
                        {loan.status === "submitted" && (
                          <>
                            <button
                              className={styles.activateBtn}
                              onClick={() => {
                                setSelectedLoan(loan);
                                setApproveForm({
                                  approvedAmount: loan.amount.toString(),
                                  approvedRate: loan.interestRate.toString(),
                                  approvedTerm: loan.term.toString(),
                                  conditions: "",
                                });
                                setShowApproveModal(true);
                              }}
                              disabled={processing}
                            >
                              Approve
                            </button>
                            <button
                              className={styles.rejectBtn}
                              onClick={() => handleReject(loan._id)}
                              disabled={processing}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {loan.status === "approved" && (
                          <button
                            className={styles.processBtn}
                            onClick={() => handleDisburse(loan._id)}
                            disabled={processing}
                          >
                            Disburse
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Approve Modal */}
        {showApproveModal && selectedLoan && (
          <div className={styles.modalOverlay} onClick={() => setShowApproveModal(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>Approve Loan</h2>
                <button onClick={() => setShowApproveModal(false)}>&times;</button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.cardInfo}>
                  <p><strong>User:</strong> {selectedLoan.userName}</p>
                  <p><strong>Type:</strong> {selectedLoan.loanType}</p>
                  <p><strong>Purpose:</strong> {selectedLoan.purpose}</p>
                  <p><strong>Employment:</strong> {selectedLoan.employmentStatus}</p>
                  <p><strong>Monthly Income:</strong> {formatCurrency(selectedLoan.monthlyIncome)}</p>
                </div>

                <div className={styles.formGroup}>
                  <label>Approved Amount</label>
                  <input
                    type="number"
                    value={approveForm.approvedAmount}
                    onChange={(e) => setApproveForm({ ...approveForm, approvedAmount: e.target.value })}
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Interest Rate (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={approveForm.approvedRate}
                      onChange={(e) => setApproveForm({ ...approveForm, approvedRate: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Term (months)</label>
                    <input
                      type="number"
                      value={approveForm.approvedTerm}
                      onChange={(e) => setApproveForm({ ...approveForm, approvedTerm: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Conditions (one per line)</label>
                  <textarea
                    rows={3}
                    placeholder="e.g., Must maintain employment"
                    value={approveForm.conditions}
                    onChange={(e) => setApproveForm({ ...approveForm, conditions: e.target.value })}
                    style={{ width: "100%", padding: "0.75rem", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", color: "white" }}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button className={styles.cancelBtn} onClick={() => setShowApproveModal(false)}>
                  Cancel
                </button>
                <button
                  className={styles.submitBtn}
                  onClick={handleApprove}
                  disabled={processing}
                >
                  {processing ? "Approving..." : "Approve Loan"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
