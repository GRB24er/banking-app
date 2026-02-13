"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./loans.module.css";

interface LoanType {
  name: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  minTerm: number;
  maxTerm: number;
  baseRate: number;
  maxRate: number;
  requiresCollateral: boolean;
}

interface LoanApplication {
  _id: string;
  applicationNumber: string;
  loanType: string;
  amount: number;
  term: number;
  interestRate: number;
  monthlyPayment: number;
  totalRepayment: number;
  status: string;
  purpose: string;
  createdAt: string;
  approvedAmount?: number;
  approvedRate?: number;
  rejectionReason?: string;
}

interface LoanEstimate {
  loanType: string;
  amount: number;
  term: number;
  interestRate: number;
  monthlyPayment: number;
  totalRepayment: number;
  totalInterest: number;
}

export default function LoansPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loanTypes, setLoanTypes] = useState<Record<string, LoanType>>({});
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applying, setApplying] = useState(false);
  const [estimate, setEstimate] = useState<LoanEstimate | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    loanType: "personal",
    amount: "",
    term: "24",
    purpose: "",
    employmentStatus: "employed",
    employerName: "",
    jobTitle: "",
    monthlyIncome: "",
    additionalIncome: "",
    existingDebts: "",
    creditScore: "700",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      fetchData();
    }
  }, [status]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [typesRes, appsRes] = await Promise.all([
        fetch("/api/loans?action=types"),
        fetch("/api/loans"),
      ]);

      const typesData = await typesRes.json();
      const appsData = await appsRes.json();

      if (typesData.success) setLoanTypes(typesData.loanTypes || {});
      if (appsData.success) setApplications(appsData.applications || []);
    } catch (err) {
      console.error("Error fetching loans:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateEstimate = async () => {
    if (!form.amount || !form.monthlyIncome) return;

    try {
      const params = new URLSearchParams({
        action: "calculate",
        loanType: form.loanType,
        amount: form.amount,
        term: form.term,
        creditScore: form.creditScore,
        monthlyIncome: form.monthlyIncome,
        employmentStatus: form.employmentStatus,
      });

      const res = await fetch(`/api/loans?${params}`);
      const data = await res.json();

      if (data.success) {
        setEstimate(data.estimate);
      }
    } catch (err) {
      console.error("Error calculating estimate:", err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(calculateEstimate, 500);
    return () => clearTimeout(timer);
  }, [form.amount, form.term, form.creditScore, form.monthlyIncome, form.employmentStatus, form.loanType]);

  const handleApply = async () => {
    setApplying(true);
    setError("");

    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loanType: form.loanType,
          amount: parseFloat(form.amount),
          term: parseInt(form.term),
          purpose: form.purpose,
          employmentStatus: form.employmentStatus,
          employerName: form.employerName,
          jobTitle: form.jobTitle,
          monthlyIncome: parseFloat(form.monthlyIncome),
          additionalIncome: form.additionalIncome ? parseFloat(form.additionalIncome) : 0,
          existingDebts: form.existingDebts ? parseFloat(form.existingDebts) : 0,
          creditScore: parseInt(form.creditScore),
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Application failed");

      setSuccess("Loan application submitted successfully! You will receive a confirmation email.");
      setShowApplyModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setApplying(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
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

  const selectedLoanType = loanTypes[form.loanType];

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <Sidebar />
        <div className={styles.main}>
          <Header />
          <div className={styles.loadingScreen}>
            <div className={styles.spinner}></div>
            <p>Loading loans...</p>
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
              <h1>Loans</h1>
              <p>Apply for personal, business, or specialized loans</p>
            </div>
            <button className={styles.applyBtn} onClick={() => setShowApplyModal(true)}>
              <span>+</span> Apply for Loan
            </button>
          </div>

          {/* Messages */}
          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}

          {/* Loan Types Overview */}
          <div className={styles.section}>
            <h2>Available Loan Products</h2>
            <div className={styles.loanTypesGrid}>
              {Object.entries(loanTypes).map(([key, type]) => (
                <div key={key} className={styles.loanTypeCard}>
                  <div className={styles.loanTypeIcon}>
                    {key === "personal" && "👤"}
                    {key === "business" && "🏢"}
                    {key === "mortgage" && "🏠"}
                    {key === "auto" && "🚗"}
                    {key === "education" && "🎓"}
                    {key === "medical" && "🏥"}
                    {key === "debt_consolidation" && "💳"}
                    {key === "home_improvement" && "🔨"}
                    {key === "vacation" && "✈️"}
                    {key === "emergency" && "🚨"}
                  </div>
                  <h3>{type.name}</h3>
                  <p>{type.description}</p>
                  <div className={styles.loanTypeDetails}>
                    <div className={styles.detailRow}>
                      <span>Amount</span>
                      <strong>{formatCurrency(type.minAmount)} - {formatCurrency(type.maxAmount)}</strong>
                    </div>
                    <div className={styles.detailRow}>
                      <span>Term</span>
                      <strong>{type.minTerm} - {type.maxTerm} months</strong>
                    </div>
                    <div className={styles.detailRow}>
                      <span>Rate from</span>
                      <strong>{type.baseRate}% APR</strong>
                    </div>
                  </div>
                  <button
                    className={styles.applySmallBtn}
                    onClick={() => {
                      setForm({ ...form, loanType: key });
                      setShowApplyModal(true);
                    }}
                  >
                    Apply Now
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* My Applications */}
          <div className={styles.section}>
            <h2>My Applications</h2>
            {applications.length === 0 ? (
              <div className={styles.emptyState}>
                <p>You haven't applied for any loans yet.</p>
              </div>
            ) : (
              <div className={styles.applicationsTable}>
                <table>
                  <thead>
                    <tr>
                      <th>Application #</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Term</th>
                      <th>Rate</th>
                      <th>Monthly</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app._id}>
                        <td className={styles.appNumber}>{app.applicationNumber}</td>
                        <td>{loanTypes[app.loanType]?.name || app.loanType}</td>
                        <td>{formatCurrency(app.approvedAmount || app.amount)}</td>
                        <td>{app.term} mo</td>
                        <td>{app.approvedRate || app.interestRate}%</td>
                        <td>{formatCurrency(app.monthlyPayment)}</td>
                        <td>
                          <span
                            className={styles.statusBadge}
                            style={{ background: getStatusColor(app.status) }}
                          >
                            {app.status.replace("_", " ")}
                          </span>
                        </td>
                        <td>{new Date(app.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        <Footer />
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className={styles.modalOverlay} onClick={() => setShowApplyModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Apply for {selectedLoanType?.name || "Loan"}</h2>
              <button onClick={() => setShowApplyModal(false)}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                {/* Loan Type */}
                <div className={styles.formGroup}>
                  <label>Loan Type</label>
                  <select
                    value={form.loanType}
                    onChange={(e) => setForm({ ...form, loanType: e.target.value })}
                  >
                    {Object.entries(loanTypes).map(([key, type]) => (
                      <option key={key} value={key}>{type.name}</option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div className={styles.formGroup}>
                  <label>Loan Amount ($)</label>
                  <input
                    type="number"
                    placeholder={`${selectedLoanType?.minAmount} - ${selectedLoanType?.maxAmount}`}
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    min={selectedLoanType?.minAmount}
                    max={selectedLoanType?.maxAmount}
                  />
                </div>

                {/* Term */}
                <div className={styles.formGroup}>
                  <label>Loan Term (months)</label>
                  <select
                    value={form.term}
                    onChange={(e) => setForm({ ...form, term: e.target.value })}
                  >
                    {[12, 24, 36, 48, 60, 72, 84].filter(t => 
                      t >= (selectedLoanType?.minTerm || 6) && t <= (selectedLoanType?.maxTerm || 84)
                    ).map(t => (
                      <option key={t} value={t}>{t} months</option>
                    ))}
                  </select>
                </div>

                {/* Purpose */}
                <div className={styles.formGroup}>
                  <label>Purpose</label>
                  <input
                    type="text"
                    placeholder="What is this loan for?"
                    value={form.purpose}
                    onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                  />
                </div>

                {/* Employment */}
                <div className={styles.formGroup}>
                  <label>Employment Status</label>
                  <select
                    value={form.employmentStatus}
                    onChange={(e) => setForm({ ...form, employmentStatus: e.target.value })}
                  >
                    <option value="employed">Employed</option>
                    <option value="self_employed">Self Employed</option>
                    <option value="retired">Retired</option>
                    <option value="student">Student</option>
                    <option value="unemployed">Unemployed</option>
                  </select>
                </div>

                {/* Monthly Income */}
                <div className={styles.formGroup}>
                  <label>Monthly Income ($)</label>
                  <input
                    type="number"
                    placeholder="Your monthly income"
                    value={form.monthlyIncome}
                    onChange={(e) => setForm({ ...form, monthlyIncome: e.target.value })}
                  />
                </div>

                {/* Employer */}
                <div className={styles.formGroup}>
                  <label>Employer Name</label>
                  <input
                    type="text"
                    placeholder="Company name"
                    value={form.employerName}
                    onChange={(e) => setForm({ ...form, employerName: e.target.value })}
                  />
                </div>

                {/* Job Title */}
                <div className={styles.formGroup}>
                  <label>Job Title</label>
                  <input
                    type="text"
                    placeholder="Your position"
                    value={form.jobTitle}
                    onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                  />
                </div>

                {/* Credit Score */}
                <div className={styles.formGroup}>
                  <label>Estimated Credit Score</label>
                  <select
                    value={form.creditScore}
                    onChange={(e) => setForm({ ...form, creditScore: e.target.value })}
                  >
                    <option value="800">Excellent (800+)</option>
                    <option value="750">Very Good (750-799)</option>
                    <option value="700">Good (700-749)</option>
                    <option value="650">Fair (650-699)</option>
                    <option value="600">Poor (600-649)</option>
                    <option value="550">Bad (Below 600)</option>
                  </select>
                </div>

                {/* Existing Debts */}
                <div className={styles.formGroup}>
                  <label>Existing Monthly Debts ($)</label>
                  <input
                    type="number"
                    placeholder="Total monthly debt payments"
                    value={form.existingDebts}
                    onChange={(e) => setForm({ ...form, existingDebts: e.target.value })}
                  />
                </div>
              </div>

              {/* Estimate */}
              {estimate && (
                <div className={styles.estimateBox}>
                  <h3>Loan Estimate</h3>
                  <div className={styles.estimateGrid}>
                    <div className={styles.estimateItem}>
                      <span>Interest Rate</span>
                      <strong>{estimate.interestRate}% APR</strong>
                    </div>
                    <div className={styles.estimateItem}>
                      <span>Monthly Payment</span>
                      <strong className={styles.highlight}>{formatCurrency(estimate.monthlyPayment)}</strong>
                    </div>
                    <div className={styles.estimateItem}>
                      <span>Total Interest</span>
                      <strong>{formatCurrency(estimate.totalInterest)}</strong>
                    </div>
                    <div className={styles.estimateItem}>
                      <span>Total Repayment</span>
                      <strong>{formatCurrency(estimate.totalRepayment)}</strong>
                    </div>
                  </div>
                </div>
              )}

              {error && <div className={styles.error}>{error}</div>}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowApplyModal(false)}>
                Cancel
              </button>
              <button
                className={styles.submitBtn}
                onClick={handleApply}
                disabled={applying || !form.amount || !form.monthlyIncome || !form.purpose}
              >
                {applying ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
