"use client";
import { useState, useEffect } from "react";
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
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    recipientName: "",
    recipientAccount: "",
    recipientBank: "",
    amount: "",
    accountType: "checking",
    description: "",
    transferType: "domestic"
  });

  // Account balances
  const accountBalances = {
    checking: 4000.00,
    savings: 1000.00,
    investment: 45458575.89
  };

  const formatBalance = (type: string) => {
    const balance = accountBalances[type as keyof typeof accountBalances];
    if (type === "investment") {
      return `$${(balance / 1000000).toFixed(2)}M`;
    }
    return `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate amount doesn't exceed balance
    const amount = parseFloat(formData.amount);
    const balance = accountBalances[formData.accountType as keyof typeof accountBalances];
    
    if (amount > balance) {
      setError("Insufficient funds in selected account");
      return;
    }

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

      setSuccess("✅ Transaction initiated successfully! Pending approval.");
      
      // Show success for 3 seconds then redirect
      setTimeout(() => {
        router.push("/transactions");
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !formData.accountType) {
      setError("Please select an account");
      return;
    }
    if (step === 2) {
      if (!formData.recipientName || !formData.recipientAccount || !formData.recipientBank) {
        setError("Please fill in all recipient details");
        return;
      }
    }
    setError("");
    setStep(step + 1);
  };

  const prevStep = () => {
    setError("");
    setStep(step - 1);
  };

  return (
    <div className={styles.wrapper}>
      <Sidebar />
      <div className={styles.main}>
        <Header />
        
        <div className={styles.content}>
          {/* Page Header */}
          <div className={styles.pageHeader}>
            <div className={styles.headerContent}>
              <div>
                <h1>Send Money</h1>
                <p>Transfer funds securely to any account worldwide</p>
              </div>
              <div className={styles.transferTypes}>
                <button 
                  className={formData.transferType === "domestic" ? styles.active : ""}
                  onClick={() => setFormData({...formData, transferType: "domestic"})}
                >
                  🏠 Domestic
                </button>
                <button 
                  className={formData.transferType === "international" ? styles.active : ""}
                  onClick={() => setFormData({...formData, transferType: "international"})}
                >
                  🌍 International
                </button>
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className={styles.progressSteps}>
            <div className={`${styles.step} ${step >= 1 ? styles.active : ''}`}>
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepLabel}>Select Account</div>
            </div>
            <div className={styles.stepLine}></div>
            <div className={`${styles.step} ${step >= 2 ? styles.active : ''}`}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepLabel}>Recipient Details</div>
            </div>
            <div className={styles.stepLine}></div>
            <div className={`${styles.step} ${step >= 3 ? styles.active : ''}`}>
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepLabel}>Transfer Amount</div>
            </div>
            <div className={styles.stepLine}></div>
            <div className={`${styles.step} ${step >= 4 ? styles.active : ''}`}>
              <div className={styles.stepNumber}>4</div>
              <div className={styles.stepLabel}>Review & Confirm</div>
            </div>
          </div>

          {/* Form Card */}
          <div className={styles.formCard}>
            <form onSubmit={handleSubmit}>
              
              {/* Step 1: Select Account */}
              {step === 1 && (
                <div className={styles.stepContent}>
                  <h3>Select Source Account</h3>
                  <p className={styles.stepDescription}>Choose which account to send money from</p>
                  
                  <div className={styles.accountOptions}>
                    {Object.entries(accountBalances).map(([type, balance]) => (
                      <div 
                        key={type}
                        className={`${styles.accountOption} ${formData.accountType === type ? styles.selected : ''}`}
                        onClick={() => setFormData({...formData, accountType: type})}
                      >
                        <div className={styles.accountIcon}>
                          {type === "checking" ? "💳" : type === "savings" ? "🏦" : "📈"}
                        </div>
                        <div className={styles.accountInfo}>
                          <div className={styles.accountName}>
                            {type.charAt(0).toUpperCase() + type.slice(1)} Account
                          </div>
                          <div className={styles.accountNumber}>****{type === "checking" ? "1234" : type === "savings" ? "5678" : "9012"}</div>
                        </div>
                        <div className={styles.accountBalance}>
                          <div className={styles.balanceLabel}>Available Balance</div>
                          <div className={styles.balanceAmount}>{formatBalance(type)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Recipient Details */}
              {step === 2 && (
                <div className={styles.stepContent}>
                  <h3>Recipient Information</h3>
                  <p className={styles.stepDescription}>Enter the recipient's banking details</p>
                  
                  <div className={styles.inputGrid}>
                    <div className={styles.inputGroup}>
                      <label>Recipient Full Name</label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={formData.recipientName}
                        onChange={(e) => setFormData({...formData, recipientName: e.target.value})}
                        required
                        className={styles.input}
                      />
                    </div>
                    
                    <div className={styles.inputGroup}>
                      <label>Account Number</label>
                      <input
                        type="text"
                        placeholder="1234567890"
                        value={formData.recipientAccount}
                        onChange={(e) => setFormData({...formData, recipientAccount: e.target.value})}
                        required
                        className={styles.input}
                      />
                    </div>
                    
                    <div className={styles.inputGroup}>
                      <label>Bank Name</label>
                      <input
                        type="text"
                        placeholder="Bank of America"
                        value={formData.recipientBank}
                        onChange={(e) => setFormData({...formData, recipientBank: e.target.value})}
                        required
                        className={styles.input}
                      />
                    </div>
                    
                    {formData.transferType === "international" && (
                      <div className={styles.inputGroup}>
                        <label>SWIFT/BIC Code</label>
                        <input
                          type="text"
                          placeholder="BOFAUS3N"
                          className={styles.input}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Transfer Amount */}
              {step === 3 && (
                <div className={styles.stepContent}>
                  <h3>Transfer Details</h3>
                  <p className={styles.stepDescription}>Enter the amount and description</p>
                  
                  <div className={styles.amountSection}>
                    <div className={styles.inputGroup}>
                      <label>Amount</label>
                      <div className={styles.amountInput}>
                        <span className={styles.currencySymbol}>$</span>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={formData.amount}
                          onChange={(e) => setFormData({...formData, amount: e.target.value})}
                          required
                          min="0.01"
                          step="0.01"
                          className={styles.amountField}
                        />
                      </div>
                      <div className={styles.quickAmounts}>
                        {[100, 500, 1000, 2000].map(amt => (
                          <button
                            key={amt}
                            type="button"
                            className={styles.quickAmountBtn}
                            onClick={() => setFormData({...formData, amount: amt.toString()})}
                          >
                            ${amt}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className={styles.inputGroup}>
                      <label>Description (Optional)</label>
                      <textarea
                        placeholder="What is this transfer for?"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className={styles.textarea}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Review & Confirm */}
              {step === 4 && (
                <div className={styles.stepContent}>
                  <h3>Review Transfer</h3>
                  <p className={styles.stepDescription}>Please review your transfer details before confirming</p>
                  
                  <div className={styles.reviewCard}>
                    <div className={styles.reviewSection}>
                      <h4>From Account</h4>
                      <div className={styles.reviewItem}>
                        <span>{formData.accountType.charAt(0).toUpperCase() + formData.accountType.slice(1)}</span>
                        <strong>{formatBalance(formData.accountType)}</strong>
                      </div>
                    </div>
                    
                    <div className={styles.reviewSection}>
                      <h4>To Recipient</h4>
                      <div className={styles.reviewItem}>
                        <span>Name</span>
                        <strong>{formData.recipientName}</strong>
                      </div>
                      <div className={styles.reviewItem}>
                        <span>Account</span>
                        <strong>{formData.recipientAccount}</strong>
                      </div>
                      <div className={styles.reviewItem}>
                        <span>Bank</span>
                        <strong>{formData.recipientBank}</strong>
                      </div>
                    </div>
                    
                    <div className={styles.reviewSection}>
                      <h4>Transfer Amount</h4>
                      <div className={styles.reviewAmount}>
                        ${parseFloat(formData.amount || "0").toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      {formData.description && (
                        <div className={styles.reviewDescription}>
                          "{formData.description}"
                        </div>
                      )}
                    </div>
                    
                    <div className={styles.warningBox}>
                      <span className={styles.warningIcon}>⚠️</span>
                      <p>This transaction will require admin approval before processing.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error and Success Messages */}
              {error && <div className={styles.error}>{error}</div>}
              {success && <div className={styles.success}>{success}</div>}

              {/* Navigation Buttons */}
              <div className={styles.navigationButtons}>
                {step > 1 && (
                  <button 
                    type="button"
                    onClick={prevStep}
                    className={styles.backButton}
                  >
                    ← Back
                  </button>
                )}
                
                {step < 4 ? (
                  <button 
                    type="button"
                    onClick={nextStep}
                    className={styles.continueButton}
                  >
                    Continue →
                  </button>
                ) : (
                  <button 
                    type="submit" 
                    className={styles.submitButton}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className={styles.spinner}></span>
                        Processing...
                      </>
                    ) : (
                      <>🔒 Confirm Transfer</>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}