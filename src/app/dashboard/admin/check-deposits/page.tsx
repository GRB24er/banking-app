// app/dashboard/admin/check-deposits/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "../admin.module.css";

interface CheckDeposit {
  id: string;
  _id?: string;
  userId: string;
  userEmail: string;
  userName: string;
  accountType: 'checking' | 'savings';
  amount: number;
  checkNumber?: string;
  frontImage: string;
  backImage: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  reviewedAt?: string;
}

interface DepositCounts {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export default function CheckDepositsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [deposits, setDeposits] = useState<CheckDeposit[]>([]);
  const [counts, setCounts] = useState<DepositCounts>({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<string>("pending");
  const [selectedDeposit, setSelectedDeposit] = useState<CheckDeposit | null>(null);
  const [processing, setProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [showImageModal, setShowImageModal] = useState<{ show: boolean; url: string; title: string }>({
    show: false,
    url: "",
    title: "",
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session || (session.user?.role !== "admin" && session.user?.email !== "admin@horizonbank.com")) {
      router.push("/login");
      return;
    }
    fetchDeposits();
  }, [session, status, activeTab]);

  const fetchDeposits = async () => {
    setLoading(true);
    setMessage("Loading check deposits...");
    
    try {
      const response = await fetch(`/api/admin/check-deposits?status=${activeTab}&limit=50`);
      const data = await response.json();

      if (data.success) {
        setDeposits(data.deposits || []);
        setCounts(data.counts || { pending: 0, approved: 0, rejected: 0, total: 0 });
        setMessage("");
      } else {
        setMessage(`⚠️ ${data.error || "Failed to load deposits"}`);
      }
    } catch (error: any) {
      console.error("Failed to fetch deposits:", error);
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedDeposit) return;

    setProcessing(true);
    setMessage("Processing approval...");
    
    try {
      const depositId = selectedDeposit.id || selectedDeposit._id;
      const response = await fetch(`/api/admin/check-deposits/${depositId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          notes: adminNotes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ ${data.message}`);
        setSelectedDeposit(null);
        setAdminNotes("");
        await fetchDeposits();
        setTimeout(() => setMessage(""), 5000);
      } else {
        setMessage(`❌ ${data.error || "Failed to approve deposit"}`);
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedDeposit) return;

    if (!rejectionReason.trim()) {
      setMessage("❌ Please provide a rejection reason");
      return;
    }

    setProcessing(true);
    setMessage("Processing rejection...");
    
    try {
      const depositId = selectedDeposit.id || selectedDeposit._id;
      const response = await fetch(`/api/admin/check-deposits/${depositId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          rejectionReason: rejectionReason.trim(),
          notes: adminNotes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ ${data.message}`);
        setSelectedDeposit(null);
        setRejectionReason("");
        setAdminNotes("");
        await fetchDeposits();
        setTimeout(() => setMessage(""), 5000);
      } else {
        setMessage(`❌ ${data.error || "Failed to reject deposit"}`);
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h1>Check Deposits Management</h1>
          <div className={styles.headerActions}>
            <button onClick={fetchDeposits} disabled={loading}>
              Refresh Deposits
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
            <h3>Pending</h3>
            <p style={{ color: "#f59e0b" }}>{counts.pending}</p>
          </div>
          <div className={styles.statCard}>
            <h3>Approved</h3>
            <p style={{ color: "#22c55e" }}>{counts.approved}</p>
          </div>
          <div className={styles.statCard}>
            <h3>Rejected</h3>
            <p style={{ color: "#ef4444" }}>{counts.rejected}</p>
          </div>
          <div className={styles.statCard}>
            <h3>Total</h3>
            <p>{counts.total}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={activeTab === "pending" ? styles.activeTab : ""}
            onClick={() => setActiveTab("pending")}
          >
            Pending ({counts.pending})
          </button>
          <button
            className={activeTab === "approved" ? styles.activeTab : ""}
            onClick={() => setActiveTab("approved")}
          >
            Approved ({counts.approved})
          </button>
          <button
            className={activeTab === "rejected" ? styles.activeTab : ""}
            onClick={() => setActiveTab("rejected")}
          >
            Rejected ({counts.rejected})
          </button>
          <button
            className={activeTab === "all" ? styles.activeTab : ""}
            onClick={() => setActiveTab("all")}
          >
            All ({counts.total})
          </button>
          {selectedDeposit && (
            <button
              className={styles.activeTab}
              onClick={() => {}}
            >
              Review Deposit
            </button>
          )}
        </div>

        {/* Content */}
        <div className={styles.content}>
          {!selectedDeposit ? (
            /* Deposits Table */
            <div className={styles.transactionsSection}>
              <h2>Check Deposits - {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
              
              {loading ? (
                <p>Loading deposits...</p>
              ) : deposits.length === 0 ? (
                <p>No {activeTab} deposits found</p>
              ) : (
                <table className={styles.transactionTable}>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Account</th>
                      <th>Amount</th>
                      <th>Check #</th>
                      <th>Status</th>
                      <th>Submitted</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deposits.map((deposit) => (
                      <tr key={deposit.id || deposit._id}>
                        <td>
                          <div>
                            <strong>{deposit.userName}</strong>
                            <br />
                            <small style={{ color: "#888" }}>{deposit.userEmail}</small>
                          </div>
                        </td>
                        <td style={{ textTransform: "capitalize" }}>{deposit.accountType}</td>
                        <td className={styles.credit}>
                          {formatCurrency(deposit.amount)}
                        </td>
                        <td>{deposit.checkNumber || "-"}</td>
                        <td>
                          <span
                            className={`${styles.status} ${styles[deposit.status]}`}
                            style={{
                              backgroundColor:
                                deposit.status === "pending"
                                  ? "rgba(245, 158, 11, 0.2)"
                                  : deposit.status === "approved"
                                  ? "rgba(34, 197, 94, 0.2)"
                                  : "rgba(239, 68, 68, 0.2)",
                              color:
                                deposit.status === "pending"
                                  ? "#f59e0b"
                                  : deposit.status === "approved"
                                  ? "#22c55e"
                                  : "#ef4444",
                              padding: "4px 12px",
                              borderRadius: "12px",
                              fontSize: "12px",
                              fontWeight: "600",
                            }}
                          >
                            {deposit.status.charAt(0).toUpperCase() + deposit.status.slice(1)}
                          </span>
                        </td>
                        <td>{formatDate(deposit.createdAt)}</td>
                        <td>
                          <div className={styles.actions}>
                            <button
                              onClick={() => {
                                setSelectedDeposit(deposit);
                                setRejectionReason("");
                                setAdminNotes(deposit.notes || "");
                              }}
                              className={styles.editBtn}
                              style={{
                                backgroundColor: "rgba(212, 175, 55, 0.2)",
                                color: "#D4AF37",
                              }}
                            >
                              Review
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            /* Review Deposit Section */
            <div className={styles.editSection}>
              <h2>Review Check Deposit</h2>
              
              {/* User & Deposit Info */}
              <div className={styles.selectedUserInfo}>
                <h3>{selectedDeposit.userName}</h3>
                <p>{selectedDeposit.userEmail}</p>
                <div className={styles.currentBalances}>
                  <span>Amount: <strong style={{ color: "#D4AF37", fontSize: "24px" }}>{formatCurrency(selectedDeposit.amount)}</strong></span>
                  <span>Account: <strong style={{ textTransform: "capitalize" }}>{selectedDeposit.accountType}</strong></span>
                  {selectedDeposit.checkNumber && <span>Check #: <strong>{selectedDeposit.checkNumber}</strong></span>}
                  <span>Submitted: {formatDate(selectedDeposit.createdAt)}</span>
                </div>
              </div>

              {/* Check Images */}
              <div style={{ marginTop: "24px" }}>
                <h4 style={{ marginBottom: "16px", color: "#888" }}>Check Images</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <p style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>Front of Check</p>
                    <div
                      style={{
                        position: "relative",
                        aspectRatio: "16/9",
                        backgroundColor: "#1a1a1a",
                        borderRadius: "12px",
                        overflow: "hidden",
                        cursor: "pointer",
                        border: "1px solid #333",
                      }}
                      onClick={() => setShowImageModal({ show: true, url: selectedDeposit.frontImage, title: "Front of Check" })}
                    >
                      <img
                        src={selectedDeposit.frontImage}
                        alt="Front of check"
                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                      />
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>Back of Check</p>
                    <div
                      style={{
                        position: "relative",
                        aspectRatio: "16/9",
                        backgroundColor: "#1a1a1a",
                        borderRadius: "12px",
                        overflow: "hidden",
                        cursor: "pointer",
                        border: "1px solid #333",
                      }}
                      onClick={() => setShowImageModal({ show: true, url: selectedDeposit.backImage, title: "Back of Check" })}
                    >
                      <img
                        src={selectedDeposit.backImage}
                        alt="Back of check"
                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                      />
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>Click images to enlarge</p>
              </div>

              {/* Already Reviewed */}
              {selectedDeposit.status !== "pending" && (
                <div style={{
                  marginTop: "24px",
                  padding: "16px",
                  backgroundColor: "#1a1a1a",
                  borderRadius: "12px",
                  border: "1px solid #333",
                }}>
                  <h4 style={{ marginBottom: "12px" }}>Review Status</h4>
                  <p>
                    <span style={{ color: "#888" }}>Status: </span>
                    <span style={{
                      color: selectedDeposit.status === "approved" ? "#22c55e" : "#ef4444",
                      fontWeight: "600",
                    }}>
                      {selectedDeposit.status.charAt(0).toUpperCase() + selectedDeposit.status.slice(1)}
                    </span>
                  </p>
                  {selectedDeposit.reviewedAt && (
                    <p><span style={{ color: "#888" }}>Reviewed: </span>{formatDate(selectedDeposit.reviewedAt)}</p>
                  )}
                  {selectedDeposit.rejectionReason && (
                    <p><span style={{ color: "#888" }}>Reason: </span><span style={{ color: "#ef4444" }}>{selectedDeposit.rejectionReason}</span></p>
                  )}
                  {selectedDeposit.notes && (
                    <p><span style={{ color: "#888" }}>Notes: </span>{selectedDeposit.notes}</p>
                  )}
                </div>
              )}

              {/* Action Form (only for pending) */}
              {selectedDeposit.status === "pending" && (
                <div className={styles.editForm} style={{ marginTop: "24px" }}>
                  <div className={styles.formGroup}>
                    <label>Admin Notes (optional)</label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add internal notes..."
                      rows={2}
                      style={{
                        width: "100%",
                        padding: "12px",
                        backgroundColor: "#1a1a1a",
                        border: "1px solid #333",
                        borderRadius: "8px",
                        color: "#fff",
                        resize: "none",
                      }}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Rejection Reason (required if rejecting)</label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Enter reason for rejection..."
                      rows={2}
                      style={{
                        width: "100%",
                        padding: "12px",
                        backgroundColor: "#1a1a1a",
                        border: "1px solid #333",
                        borderRadius: "8px",
                        color: "#fff",
                        resize: "none",
                      }}
                    />
                  </div>

                  <div className={styles.formActions} style={{ display: "flex", gap: "16px", marginTop: "24px" }}>
                    <button
                      onClick={handleApprove}
                      disabled={processing}
                      style={{
                        flex: 1,
                        padding: "14px",
                        backgroundColor: "#22c55e",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "16px",
                        fontWeight: "600",
                        cursor: "pointer",
                        opacity: processing ? 0.5 : 1,
                      }}
                    >
                      {processing ? "Processing..." : "✓ Approve Deposit"}
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={processing}
                      style={{
                        flex: 1,
                        padding: "14px",
                        backgroundColor: "#ef4444",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "16px",
                        fontWeight: "600",
                        cursor: "pointer",
                        opacity: processing ? 0.5 : 1,
                      }}
                    >
                      {processing ? "Processing..." : "✗ Reject Deposit"}
                    </button>
                  </div>

                  <p style={{ textAlign: "center", color: "#888", fontSize: "14px", marginTop: "16px" }}>
                    Approving will add {formatCurrency(selectedDeposit.amount)} to the user's {selectedDeposit.accountType} account.
                  </p>
                </div>
              )}

              {/* Back Button */}
              <button
                onClick={() => setSelectedDeposit(null)}
                style={{
                  marginTop: "24px",
                  padding: "12px 24px",
                  backgroundColor: "#333",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                ← Back to Deposits List
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal.show && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.95)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => setShowImageModal({ show: false, url: "", title: "" })}
        >
          <div style={{ maxWidth: "90vw", maxHeight: "90vh" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ color: "#fff" }}>{showImageModal.title}</h3>
              <button
                onClick={() => setShowImageModal({ show: false, url: "", title: "" })}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: "#333",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "20px",
                }}
              >
                ✕
              </button>
            </div>
            <img
              src={showImageModal.url}
              alt={showImageModal.title}
              style={{
                maxWidth: "100%",
                maxHeight: "80vh",
                objectFit: "contain",
                borderRadius: "12px",
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}