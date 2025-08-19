"use client";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import styles from "./loans.module.css";

export default function LoansPage() {
  const loans = [
    {
      id: 1,
      type: "Mortgage",
      accountNumber: "****8934",
      originalAmount: 450000,
      remainingBalance: 385420,
      monthlyPayment: 2850,
      interestRate: 3.75,
      nextPayment: "2025-09-01",
      term: "30 years",
      startDate: "2020-06-15"
    },
    {
      id: 2,
      type: "Auto Loan",
      accountNumber: "****2156",
      originalAmount: 35000,
      remainingBalance: 18500,
      monthlyPayment: 650,
      interestRate: 4.25,
      nextPayment: "2025-09-05",
      term: "5 years",
      startDate: "2022-03-10"
    }
  ];

  return (
    <div className={styles.wrapper}>
      <Sidebar />
      <div className={styles.main}>
        <Header />
        
        <div className={styles.content}>
          <div className={styles.pageHeader}>
            <h1>Loans</h1>
            <button className={styles.applyBtn}>Apply for Loan</button>
          </div>

          <div className={styles.loansGrid}>
            {loans.map(loan => (
              <div key={loan.id} className={styles.loanCard}>
                <div className={styles.loanHeader}>
                  <h3>{loan.type}</h3>
                  <span className={styles.accountNumber}>{loan.accountNumber}</span>
                </div>

                <div className={styles.loanBalance}>
                  <div className={styles.balanceInfo}>
                    <span>Remaining Balance</span>
                    <h2>${loan.remainingBalance.toLocaleString()}</h2>
                  </div>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill}
                      style={{ 
                        width: `${((loan.originalAmount - loan.remainingBalance) / loan.originalAmount) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <div className={styles.progressLabels}>
                    <span>Paid: ${(loan.originalAmount - loan.remainingBalance).toLocaleString()}</span>
                    <span>Total: ${loan.originalAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className={styles.loanDetails}>
                  <div className={styles.detailRow}>
                    <span>Monthly Payment</span>
                    <strong>${loan.monthlyPayment}</strong>
                  </div>
                  <div className={styles.detailRow}>
                   <span>Interest Rate</span>
                   <strong>{loan.interestRate}%</strong>
                 </div>
                 <div className={styles.detailRow}>
                   <span>Next Payment</span>
                   <strong>{loan.nextPayment}</strong>
                 </div>
                 <div className={styles.detailRow}>
                   <span>Loan Term</span>
                   <strong>{loan.term}</strong>
                 </div>
               </div>

               <div className={styles.loanActions}>
                 <button className={styles.paymentBtn}>Make Payment</button>
                 <button className={styles.detailsBtn}>View Details</button>
               </div>
             </div>
           ))}
         </div>

         <div className={styles.calculatorSection}>
           <h2>Loan Calculator</h2>
           <div className={styles.calculator}>
             <div className={styles.calcInputs}>
               <div className={styles.inputGroup}>
                 <label>Loan Amount</label>
                 <input type="number" placeholder="$100,000" />
               </div>
               <div className={styles.inputGroup}>
                 <label>Interest Rate (%)</label>
                 <input type="number" placeholder="4.5" step="0.1" />
               </div>
               <div className={styles.inputGroup}>
                 <label>Term (Years)</label>
                 <input type="number" placeholder="30" />
               </div>
               <button className={styles.calculateBtn}>Calculate</button>
             </div>
           </div>
         </div>
       </div>
     </div>
   </div>
 );
}