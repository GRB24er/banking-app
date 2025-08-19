"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import styles from "./investment.module.css";

export default function InvestmentAccountPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  const investmentBalance = 45458575.89;
  const initialInvestment = 9600000;
  const totalReturn = investmentBalance - initialInvestment;
  const returnPercentage = ((totalReturn / initialInvestment) * 100).toFixed(2);

  const portfolioData = [
    { name: "Technology Stocks", value: 35, amount: 15910501.56, change: +12.5 },
    { name: "Real Estate", value: 25, amount: 11364643.97, change: +8.3 },
    { name: "Bonds", value: 20, amount: 9091715.18, change: +3.2 },
    { name: "International Equity", value: 15, amount: 6818786.38, change: +15.7 },
    { name: "Commodities", value: 5, amount: 2272928.79, change: -2.1 }
  ];

  return (
    <div className={styles.wrapper}>
      <Sidebar />
      <div className={styles.main}>
        <Header />
        
        <div className={styles.content}>
          <div className={styles.pageHeader}>
            <div>
              <h1>Investment Portfolio</h1>
              <p>Manage and monitor your investment performance</p>
            </div>
            <div className={styles.headerActions}>
              <button className={styles.tradeButton}>
                📈 Trade Now
              </button>
              <button className={styles.reportButton}>
                📊 Download Report
              </button>
            </div>
          </div>

          {/* Portfolio Summary */}
          <div className={styles.summaryCards}>
            <div className={styles.summaryCard}>
              <div className={styles.cardIcon}>💰</div>
              <div className={styles.cardContent}>
                <div className={styles.cardLabel}>Total Portfolio Value</div>
                <div className={styles.cardValue}>
                  ${(investmentBalance / 1000000).toFixed(2)}M
                </div>
                <div className={styles.cardChange}>+373.53% all time</div>
              </div>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.cardIcon}>📈</div>
              <div className={styles.cardContent}>
                <div className={styles.cardLabel}>Total Returns</div>
                <div className={styles.cardValue}>
                  ${(totalReturn / 1000000).toFixed(2)}M
                </div>
                <div className={styles.cardChange}>+{returnPercentage}%</div>
              </div>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.cardIcon}>🎯</div>
              <div className={styles.cardContent}>
                <div className={styles.cardLabel}>Initial Investment</div>
                <div className={styles.cardValue}>
                  ${(initialInvestment / 1000000).toFixed(2)}M
                </div>
                <div className={styles.cardChange}>June 2003</div>
              </div>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.cardIcon}>⏱️</div>
              <div className={styles.cardContent}>
                <div className={styles.cardLabel}>Investment Period</div>
                <div className={styles.cardValue}>20 Years</div>
                <div className={styles.cardChange}>Long-term Growth</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className={styles.tabs}>
            <button 
              className={activeTab === "overview" ? styles.activeTab : ""}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            <button 
              className={activeTab === "holdings" ? styles.activeTab : ""}
              onClick={() => setActiveTab("holdings")}
            >
              Holdings
            </button>
            <button 
              className={activeTab === "performance" ? styles.activeTab : ""}
              onClick={() => setActiveTab("performance")}
            >
              Performance
            </button>
            <button 
              className={activeTab === "transactions" ? styles.activeTab : ""}
              onClick={() => setActiveTab("transactions")}
            >
              Transactions
            </button>
          </div>

          {/* Tab Content */}
          <div className={styles.tabContent}>
            {activeTab === "overview" && (
              <div className={styles.portfolioBreakdown}>
                <h3>Portfolio Allocation</h3>
                <div className={styles.allocationList}>
                  {portfolioData.map((item, index) => (
                    <div key={index} className={styles.allocationItem}>
                      <div className={styles.allocationInfo}>
                        <div className={styles.allocationName}>{item.name}</div>
                        <div className={styles.allocationPercent}>{item.value}%</div>
                      </div>
                      <div className={styles.allocationBar}>
                        <div 
                          className={styles.allocationFill}
                          style={{ width: `${item.value}%` }}
                        ></div>
                      </div>
                      <div className={styles.allocationDetails}>
                        <span className={styles.allocationAmount}>
                          ${(item.amount / 1000000).toFixed(2)}M
                        </span>
                        <span className={item.change >= 0 ? styles.positive : styles.negative}>
                          {item.change >= 0 ? '+' : ''}{item.change}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}