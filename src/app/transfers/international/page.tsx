// src/app/transfers/international/page.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import styles from "./international.module.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Sidebar from "@/components/Sidebar";

interface InternationalTransferData {
  fromAccount: string;
  amount: string;
  sourceCurrency: string;
  targetCurrency: string;
  
  // Recipient
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
  recipientAddress: string;
  recipientCity: string;
  recipientCountry: string;
  recipientPostalCode: string;
  
  // Bank Details
  bankName: string;
  iban: string;
  swiftBic: string;
  sortCode?: string;
  bankAddress: string;
  
  // Transfer Details
  purpose: string;
  reference: string;
  transferSpeed: "economy" | "express" | "urgent";
  
  // Compliance
  sourceOfFunds: string;
  relationship: string;
}

export default function InternationalTransferPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(1.18); // Mock USD to EUR rate
  
  const [formData, setFormData] = useState<InternationalTransferData>({
    fromAccount: "",
    amount: "",
    sourceCurrency: "USD",
    targetCurrency: "EUR",
    recipientName: "",
    recipientEmail: "",
    recipientPhone: "",
    recipientAddress: "",
    recipientCity: "",
    recipientCountry: "",
    recipientPostalCode: "",
    bankName: "",
    iban: "",
    swiftBic: "",
    sortCode: "",
    bankAddress: "",
    purpose: "",
    reference: "",
    transferSpeed: "economy",
    sourceOfFunds: "",
    relationship: ""
  });

  const countries = [
    { code: "GB", name: "United Kingdom", currency: "GBP" },
    { code: "FR", name: "France", currency: "EUR" },
    { code: "DE", name: "Germany", currency: "EUR" },
    { code: "ES", name: "Spain", currency: "EUR" },
    { code: "IT", name: "Italy", currency: "EUR" },
    { code: "CA", name: "Canada", currency: "CAD" },
    { code: "AU", name: "Australia", currency: "AUD" },
    { code: "JP", name: "Japan", currency: "JPY" },
    { code: "CN", name: "China", currency: "CNY" },
    { code: "IN", name: "India", currency: "INR" },
    { code: "BR", name: "Brazil", currency: "BRL" },
    { code: "MX", name: "Mexico", currency: "MXN" }
  ];

  const transferSpeeds = [
    { 
      id: "economy", 
      name: "Economy", 
      time: "3-5 business days", 
      fee: 15,
      description: "Low cost option for non-urgent transfers"
    },
    { 
      id: "express", 
      name: "Express", 
      time: "1-2 business days", 
      fee: 35,
      description: "Faster delivery with tracking"
    },
    { 
      id: "urgent", 
      name: "Urgent", 
      time: "Same day", 
      fee: 75,
      description: "Priority processing for urgent needs"
    }
  ];

  const handleInputChange = (field: keyof InternationalTransferData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateTotal = () => {
    const amount = parseFloat(formData.amount) || 0;
    const selectedSpeed = transferSpeeds.find(s => s.id === formData.transferSpeed);
    const fee = selectedSpeed?.fee || 0;
    const convertedAmount = amount * exchangeRate;
    
    return {
      sourceAmount: amount,
      fee: fee,
      totalDebit: amount + fee,
      convertedAmount: convertedAmount,
      exchangeRate: exchangeRate
    };
  };

  const handleSubmit = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setCurrentStep(5); // Success
    }, 3000);
  };

  const stepTitles = [
    "Amount & Currency",
    "Recipient Details", 
    "Bank Information",
    "Review & Confirm"
  ];

  return (
    <div className={styles.wrapper}>
      <Sidebar />
      <div className={styles.mainContent}>
        <Header />
        
        {/* Header */}
        <div className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <h1 className={styles.pageTitle}>International Money Transfer</h1>
            <p className={styles.pageSubtitle}>
              Send money worldwide with competitive exchange rates
            </p>
          </div>

          {/* Progress Steps */}
          <div className={styles.progressContainer}>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ width: `${(currentStep / 4) * 100}%` }}
              />
            </div>
            <div className={styles.progressSteps}>
              {stepTitles.map((title, index) => (
                <div 
                  key={index}
                  className={`${styles.progressStep} ${
                    currentStep > index ? styles.completed : ''
                  } ${currentStep === index + 1 ? styles.active : ''}`}
                >
                  <div className={styles.stepCircle}>
                    {currentStep > index + 1 ? '✓' : index + 1}
                  </div>
                  <span className={styles.stepTitle}>{title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.container}>
          <div className={styles.formCard}>
            <AnimatePresence mode="wait">
              {/* Step 1: Amount & Currency */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={styles.stepContent}
                >
                  <h2 className={styles.sectionTitle}>Transfer Amount & Currency</h2>
                  
                  <div className={styles.currencyConverter}>
                    <div className={styles.converterRow}>
                      <div className={styles.currencyInput}>
                        <label>You Send</label>
                        <div className={styles.inputGroup}>
                          <select
                            value={formData.sourceCurrency}
                            onChange={(e) => handleInputChange("sourceCurrency", e.target.value)}
                            className={styles.currencySelect}
                          >
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                          </select>
                          <input
                            type="number"
                            value={formData.amount}
                            onChange={(e) => handleInputChange("amount", e.target.value)}
                            placeholder="0.00"
                            className={styles.amountInput}
                          />
                        </div>
                      </div>

                      <div className={styles.exchangeRate}>
                        <div className={styles.rateInfo}>
                          <span className={styles.rateLabel}>Exchange Rate</span>
                          <span className={styles.rateValue}>
                            1 {formData.sourceCurrency} = {exchangeRate} {formData.targetCurrency}
                          </span>
                        </div>
                        <div className={styles.rateArrow}>→</div>
                      </div>

                      <div className={styles.currencyInput}>
                        <label>Recipient Gets</label>
                        <div className={styles.inputGroup}>
                          <select
                            value={formData.targetCurrency}
                            onChange={(e) => handleInputChange("targetCurrency", e.target.value)}
                            className={styles.currencySelect}
                          >
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                            <option value="CAD">CAD</option>
                            <option value="AUD">AUD</option>
                            <option value="JPY">JPY</option>
                          </select>
                          <input
                            type="text"
                            value={(parseFloat(formData.amount || "0") * exchangeRate).toFixed(2)}
                            readOnly
                            className={styles.amountInput}
                            style={{ backgroundColor: '#f8fafc' }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className={styles.feeBreakdown}>
                      <div className={styles.feeItem}>
                        <span>Transfer Amount:</span>
                        <strong>{formData.sourceCurrency} {formData.amount || "0.00"}</strong>
                      </div>
                      <div className={styles.feeItem}>
                        <span>Our Fee:</span>
                        <strong>
                          {formData.sourceCurrency} {
                            transferSpeeds.find(s => s.id === formData.transferSpeed)?.fee || 0
                          }.00
                        </strong>
                      </div>
                      <div className={styles.feeItem}>
                        <span>Total to be Debited:</span>
                        <strong>
                          {formData.sourceCurrency} {calculateTotal().totalDebit.toFixed(2)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className={styles.transferSpeedSection}>
                    <h3>Select Transfer Speed</h3>
                    <div className={styles.speedOptions}>
                      {transferSpeeds.map((speed) => (
                        <div
                          key={speed.id}
                          className={`${styles.speedOption} ${
                            formData.transferSpeed === speed.id ? styles.selected : ''
                          }`}
                          onClick={() => handleInputChange("transferSpeed", speed.id)}
                        >
                          <div className={styles.speedHeader}>
                            <span className={styles.speedName}>{speed.name}</span>
                            <span className={styles.speedFee}>${speed.fee}</span>
                          </div>
                          <div className={styles.speedTime}>{speed.time}</div>
                          <div className={styles.speedDesc}>{speed.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={styles.formActions}>
                    <button 
                      className={styles.btnSecondary}
                      onClick={() => router.push('/dashboard')}
                    >
                      Cancel
                    </button>
                    <button 
                      className={styles.btnPrimary}
                      onClick={() => setCurrentStep(2)}
                    >
                      Continue
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Recipient Details */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={styles.stepContent}
                >
                  <h2 className={styles.sectionTitle}>Recipient Information</h2>
                  
                  <div className={styles.formGrid}>
                    <div className={styles.formField}>
                      <label>Full Name <span className={styles.required}>*</span></label>
                      <input
                        type="text"
                        value={formData.recipientName}
                        onChange={(e) => handleInputChange("recipientName", e.target.value)}
                        placeholder="As it appears on bank account"
                      />
                    </div>

                    <div className={styles.formField}>
                      <label>Country <span className={styles.required}>*</span></label>
                      <select
                        value={formData.recipientCountry}
                        onChange={(e) => handleInputChange("recipientCountry", e.target.value)}
                      >
                        <option value="">Select Country</option>
                        {countries.map(country => (
                          <option key={country.code} value={country.code}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.formField}>
                      <label>Email Address</label>
                      <input
                        type="email"
                        value={formData.recipientEmail}
                        onChange={(e) => handleInputChange("recipientEmail", e.target.value)}
                        placeholder="recipient@email.com"
                      />
                    </div>

                    <div className={styles.formField}>
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        value={formData.recipientPhone}
                        onChange={(e) => handleInputChange("recipientPhone", e.target.value)}
                        placeholder="+1 234 567 8900"
                      />
                    </div>

                    <div className={`${styles.formField} ${styles.fullWidth}`}>
                      <label>Street Address <span className={styles.required}>*</span></label>
                      <input
                        type="text"
                        value={formData.recipientAddress}
                        onChange={(e) => handleInputChange("recipientAddress", e.target.value)}
                        placeholder="123 Main Street, Apartment 4B"
                      />
                    </div>

                    <div className={styles.formField}>
                      <label>City <span className={styles.required}>*</span></label>
                      <input
                        type="text"
                        value={formData.recipientCity}
                        onChange={(e) => handleInputChange("recipientCity", e.target.value)}
                        placeholder="London"
                      />
                    </div>

                    <div className={styles.formField}>
                      <label>Postal Code</label>
                      <input
                        type="text"
                        value={formData.recipientPostalCode}
                        onChange={(e) => handleInputChange("recipientPostalCode", e.target.value)}
                        placeholder="SW1A 1AA"
                      />
                    </div>

                    <div className={styles.formField}>
                      <label>Your Relationship <span className={styles.required}>*</span></label>
                      <select
                        value={formData.relationship}
                        onChange={(e) => handleInputChange("relationship", e.target.value)}
                      >
                        <option value="">Select Relationship</option>
                        <option value="family">Family Member</option>
                        <option value="friend">Friend</option>
                        <option value="business">Business Partner</option>
                        <option value="employee">Employee</option>
                        <option value="supplier">Supplier/Vendor</option>
                        <option value="customer">Customer</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className={styles.formField}>
                      <label>Source of Funds <span className={styles.required}>*</span></label>
                      <select
                        value={formData.sourceOfFunds}
                        onChange={(e) => handleInputChange("sourceOfFunds", e.target.value)}
                      >
                        <option value="">Select Source</option>
                        <option value="salary">Salary/Income</option>
                        <option value="savings">Personal Savings</option>
                        <option value="business">Business Revenue</option>
                        <option value="investment">Investment Returns</option>
                        <option value="property">Property Sale</option>
                        <option value="gift">Gift</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.formActions}>
                    <button 
                      className={styles.btnSecondary}
                      onClick={() => setCurrentStep(1)}
                    >
                      Back
                    </button>
                    <button 
                      className={styles.btnPrimary}
                      onClick={() => setCurrentStep(3)}
                    >
                      Continue
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Bank Information */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={styles.stepContent}
                >
                  <h2 className={styles.sectionTitle}>Recipient Bank Details</h2>
                  
                  <div className={styles.bankDetailsInfo}>
                    <div className={styles.infoIcon}>ℹ️</div>
                    <p>
                      Please ensure all bank details are correct. Incorrect information may result in 
                      transfer delays or funds being returned.
                    </p>
                  </div>

                  <div className={styles.formGrid}>
                    <div className={`${styles.formField} ${styles.fullWidth}`}>
                      <label>Bank Name <span className={styles.required}>*</span></label>
                      <input
                        type="text"
                        value={formData.bankName}
                        onChange={(e) => handleInputChange("bankName", e.target.value)}
                        placeholder="HSBC Bank"
                      />
                    </div>

                    <div className={styles.formField}>
                      <label>IBAN <span className={styles.required}>*</span></label>
                      <input
                        type="text"
                        value={formData.iban}
                        onChange={(e) => handleInputChange("iban", e.target.value)}
                        placeholder="GB00 XXXX 0000 0000 0000 00"
                        style={{ textTransform: 'uppercase' }}
                      />
                    </div>

                    <div className={styles.formField}>
                      <label>SWIFT/BIC Code <span className={styles.required}>*</span></label>
                      <input
                        type="text"
                        value={formData.swiftBic}
                        onChange={(e) => handleInputChange("swiftBic", e.target.value)}
                        placeholder="HBUKGB4B"
                        maxLength={11}
                        style={{ textTransform: 'uppercase' }}
                      />
                    </div>

                    {formData.recipientCountry === "GB" && (
                      <div className={styles.formField}>
                        <label>Sort Code</label>
                        <input
                          type="text"
                          value={formData.sortCode}
                          onChange={(e) => handleInputChange("sortCode", e.target.value)}
                          placeholder="00-00-00"
                          maxLength={8}
                        />
                      </div>
                    )}

                    <div className={`${styles.formField} ${styles.fullWidth}`}>
                      <label>Bank Address</label>
                      <input
                        type="text"
                        value={formData.bankAddress}
                        onChange={(e) => handleInputChange("bankAddress", e.target.value)}
                        placeholder="Bank street address (optional)"
                      />
                    </div>

                    <div className={`${styles.formField} ${styles.fullWidth}`}>
                      <label>Purpose of Transfer <span className={styles.required}>*</span></label>
                      <select
                        value={formData.purpose}
                        onChange={(e) => handleInputChange("purpose", e.target.value)}
                      >
                        <option value="">Select Purpose</option>
                        <option value="family">Family Support</option>
                        <option value="education">Education/Tuition</option>
                        <option value="medical">Medical Expenses</option>
                        <option value="travel">Travel</option>
                        <option value="property">Property Purchase</option>
                        <option value="investment">Investment</option>
                        <option value="business">Business Payment</option>
                        <option value="goods">Purchase of Goods</option>
                        <option value="services">Payment for Services</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className={`${styles.formField} ${styles.fullWidth}`}>
                      <label>Reference/Message</label>
                      <textarea
                        value={formData.reference}
                        onChange={(e) => handleInputChange("reference", e.target.value)}
                        placeholder="Optional message or reference for recipient"
                        rows={3}
                        maxLength={140}
                      />
                    </div>
                  </div>

                  <div className={styles.formActions}>
                    <button 
                      className={styles.btnSecondary}
                      onClick={() => setCurrentStep(2)}
                    >
                      Back
                    </button>
                    <button 
                      className={styles.btnPrimary}
                      onClick={() => setCurrentStep(4)}
                    >
                      Review Transfer
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Review & Confirm */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={styles.stepContent}
                >
                  <h2 className={styles.sectionTitle}>Review & Confirm Transfer</h2>
                  
                  <div className={styles.reviewSections}>
                    <div className={styles.reviewCard}>
                      <h3>Transfer Summary</h3>
                      <div className={styles.summaryAmount}>
                        <div className={styles.summaryRow}>
                          <span>You Send:</span>
                          <strong className={styles.primaryAmount}>
                            {formData.sourceCurrency} {formData.amount}
                          </strong>
                        </div>
                        <div className={styles.summaryRow}>
                          <span>Transfer Fee:</span>
                          <strong>
                            {formData.sourceCurrency} {
                              transferSpeeds.find(s => s.id === formData.transferSpeed)?.fee
                            }.00
                          </strong>
                        </div>
                        <div className={`${styles.summaryRow} ${styles.total}`}>
                          <span>Total Debit:</span>
                          <strong>
                            {formData.sourceCurrency} {calculateTotal().totalDebit.toFixed(2)}
                          </strong>
                        </div>
                        <div className={styles.exchangeInfo}>
                          <span>Exchange Rate: 1 {formData.sourceCurrency} = {exchangeRate} {formData.targetCurrency}</span>
                        </div>
                        <div className={`${styles.summaryRow} ${styles.receives}`}>
                          <span>Recipient Receives:</span>
                          <strong className={styles.primaryAmount}>
                            {formData.targetCurrency} {calculateTotal().convertedAmount.toFixed(2)}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className={styles.reviewCard}>
                      <h3>Recipient Details</h3>
                      <div className={styles.reviewDetails}>
                        <div className={styles.detailRow}>
                          <span>Name:</span>
                          <strong>{formData.recipientName}</strong>
                        </div>
                        <div className={styles.detailRow}>
                          <span>Location:</span>
                          <strong>{formData.recipientCity}, {formData.recipientCountry}</strong>
                        </div>
                        <div className={styles.detailRow}>
                          <span>Bank:</span>
                          <strong>{formData.bankName}</strong>
                        </div>
                        <div className={styles.detailRow}>
                          <span>IBAN:</span>
                          <strong>{formData.iban}</strong>
                        </div>
                        <div className={styles.detailRow}>
                          <span>SWIFT/BIC:</span>
                          <strong>{formData.swiftBic}</strong>
                        </div>
                      </div>
                    </div>

                    <div className={styles.reviewCard}>
                      <h3>Transfer Information</h3>
                      <div className={styles.reviewDetails}>
                        <div className={styles.detailRow}>
                          <span>Speed:</span>
                          <strong>
                            {transferSpeeds.find(s => s.id === formData.transferSpeed)?.name} - {
                              transferSpeeds.find(s => s.id === formData.transferSpeed)?.time
                            }
                          </strong>
                        </div>
                        <div className={styles.detailRow}>
                          <span>Purpose:</span>
                          <strong>{formData.purpose}</strong>
                        </div>
                        <div className={styles.detailRow}>
                          <span>Reference:</span>
                          <strong>{formData.reference || "N/A"}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.complianceNotice}>
                    <input type="checkbox" id="compliance" required />
                    <label htmlFor="compliance">
                      I confirm that the information provided is accurate and I comply with all applicable 
                      laws and regulations regarding international money transfers. I understand that providing 
                      false information is a criminal offense.
                    </label>
                  </div>

                  <div className={styles.formActions}>
                    <button 
                      className={styles.btnSecondary}
                      onClick={() => setCurrentStep(3)}
                      disabled={loading}
                    >
                      Back
                    </button>
                    <button 
                      className={styles.btnPrimary}
                      onClick={handleSubmit}
                      disabled={loading}
                    >
                      {loading ? "Processing Transfer..." : "Confirm & Send"}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 5: Success */}
              {currentStep === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={styles.successContent}
                >
                  <div className={styles.successIcon}>✓</div>
                  <h2 className={styles.successTitle}>Transfer Initiated Successfully!</h2>
                  <p className={styles.successMessage}>
                    Your international transfer of {formData.sourceCurrency} {formData.amount} to {formData.recipientName} 
                    has been initiated and will be processed within {
                      transferSpeeds.find(s => s.id === formData.transferSpeed)?.time
                    }.
                  </p>
                  
                  <div className={styles.referenceNumber}>
                    <span>Reference Number:</span>
                    <strong>INT{Date.now()}</strong>
                  </div>

                  <div className={styles.nextSteps}>
                    <h3>What Happens Next?</h3>
                    <ul>
                      <li>You'll receive an email confirmation shortly</li>
                      <li>We'll notify you when the transfer is complete</li>
                      <li>Track your transfer status in the transactions section</li>
                      <li>The recipient will be notified when funds arrive</li>
                    </ul>
                  </div>

                  <div className={styles.successActions}>
                    <button 
                      className={styles.btnSecondary}
                      onClick={() => window.print()}
                    >
                      Download Receipt
                    </button>
                    <button 
                      className={styles.btnPrimary}
                      onClick={() => router.push('/dashboard')}
                    >
                      Back to Dashboard
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Sidebar */}
          {currentStep < 5 && (
            <div className={styles.infoSidebar}>
              <div className={styles.exchangeRateCard}>
                <h3>Today's Rates</h3>
                <div className={styles.ratesList}>
                  <div className={styles.rateItem}>
                    <span>USD → EUR</span>
                    <strong>0.92</strong>
                  </div>
                  <div className={styles.rateItem}>
                    <span>USD → GBP</span>
                    <strong>0.79</strong>
                  </div>
                  <div className={styles.rateItem}>
                    <span>USD → CAD</span>
                    <strong>1.36</strong>
                  </div>
                  <div className={styles.rateItem}>
                    <span>USD → AUD</span>
                    <strong>1.52</strong>
                  </div>
                </div>
                <p className={styles.rateNote}>Rates updated every 60 seconds</p>
              </div>

              <div className={styles.supportCard}>
                <h3>Need Help?</h3>
                <p>Our international transfer specialists are here to help</p>
                <button className={styles.supportButton}>
                  💬 Start Live Chat
                </button>
                <div className={styles.supportContact}>
                  <span>Or call:</span>
                  <strong>1-800-HORIZON</strong>
                </div>
              </div>

              <div className={styles.securityCard}>
                <h3>Your Security</h3>
                <ul className={styles.securityList}>
                 <li>🔒 256-bit encryption</li>
                 <li>🛡️ Fraud monitoring 24/7</li>
                 <li>✓ Licensed & regulated</li>
                 <li>🏦 SWIFT network member</li>
               </ul>
             </div>
           </div>
         )}
       </div>

       <Footer />
     </div>
   </div>
 );
}
