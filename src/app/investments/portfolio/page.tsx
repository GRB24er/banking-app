"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import styles from "./portfolio.module.css";
import dynamic from 'next/dynamic';

// Dynamically import Chart components to avoid SSR issues
const Line = dynamic(() => import('react-chartjs-2').then(mod => mod.Line), { ssr: false });
const Doughnut = dynamic(() => import('react-chartjs-2').then(mod => mod.Doughnut), { ssr: false });

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    
    // Register Chart.js components only on client side
    if (typeof window !== 'undefined') {
      import('chart.js').then((ChartJS) => {
        ChartJS.Chart.register(
          ChartJS.CategoryScale,
          ChartJS.LinearScale,
          ChartJS.PointElement,
          ChartJS.LineElement,
          ChartJS.Title,
          ChartJS.Tooltip,
          ChartJS.Legend,
          ChartJS.ArcElement
        );
      });
    }
  }, []);
  
  const portfolioValue = 45458575.89;
  const initialInvestment = 9600000;
  const totalReturn = portfolioValue - initialInvestment;
  const returnPercentage = 373.53;

  const holdings = [
    { 
      symbol: "AAPL", 
      name: "Apple Inc.", 
      shares: 5000, 
      avgCost: 145.50, 
      currentPrice: 189.25, 
      value: 946250, 
      gain: 218750, 
      gainPercent: 30.09,
      dayChange: 2.34,
      dayChangePercent: 1.24
    },
    { 
      symbol: "MSFT", 
      name: "Microsoft Corporation", 
      shares: 3500, 
      avgCost: 285.25, 
      currentPrice: 378.85, 
      value: 1325975, 
      gain: 327600, 
      gainPercent: 32.82,
      dayChange: 5.67,
      dayChangePercent: 1.52
    },
    { 
      symbol: "GOOGL", 
      name: "Alphabet Inc.", 
      shares: 2000, 
      avgCost: 125.40, 
      currentPrice: 142.65, 
      value: 285300, 
      gain: 34500, 
      gainPercent: 13.74,
      dayChange: -1.23,
      dayChangePercent: -0.86
    },
    { 
      symbol: "AMZN", 
      name: "Amazon.com Inc.", 
      shares: 4000, 
      avgCost: 98.75, 
      currentPrice: 178.35, 
      value: 713400, 
      gain: 318400, 
      gainPercent: 80.61,
      dayChange: 3.45,
      dayChangePercent: 1.97
    },
    { 
      symbol: "NVDA", 
      name: "NVIDIA Corporation", 
      shares: 2500, 
      avgCost: 295.22, 
      currentPrice: 495.22, 
      value: 1238050, 
      gain: 500000, 
      gainPercent: 67.74,
      dayChange: 12.45,
      dayChangePercent: 2.58
    },
    { 
      symbol: "BRK.B", 
      name: "Berkshire Hathaway", 
      shares: 8000, 
      avgCost: 267.12, 
      currentPrice: 367.12, 
      value: 2936960, 
      gain: 800000, 
      gainPercent: 37.43,
      dayChange: 1.78,
      dayChangePercent: 0.49
    },
    { 
      symbol: "TSLA", 
      name: "Tesla Inc.", 
      shares: 1500, 
      avgCost: 148.50, 
      currentPrice: 248.50, 
      value: 372750, 
      gain: 150000, 
      gainPercent: 67.34,
      dayChange: -8.90,
      dayChangePercent: -3.46
    }
  ];

  const assetAllocation = [
    { category: "Technology", value: 27.5, amount: 12501082.87, color: "#6366f1" },
    { category: "Finance", value: 22.5, amount: 10228179.58, color: "#8b5cf6" },
    { category: "Healthcare", value: 15, amount: 6818786.38, color: "#10b981" },
    { category: "Consumer", value: 12.5, amount: 5682321.99, color: "#f59e0b" },
    { category: "Energy", value: 10, amount: 4545857.59, color: "#ef4444" },
    { category: "Real Estate", value: 7.5, amount: 3409393.19, color: "#06b6d4" },
    { category: "Other", value: 5, amount: 2272928.79, color: "#94a3b8" }
  ];

  // Chart data for performance
  const performanceData = {
    labels: ['2003', '2008', '2013', '2018', '2023', '2025'],
    datasets: [{
      label: 'Portfolio Value',
      data: [9600000, 15000000, 22000000, 31000000, 42000000, 45458575.89],
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      tension: 0.4
    }]
  };

  const doughnutData = {
    labels: assetAllocation.map(a => a.category),
    datasets: [{
      data: assetAllocation.map(a => a.value),
      backgroundColor: assetAllocation.map(a => a.color),
      borderWidth: 0
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      }
    }
  };

  return (
    <div className={styles.wrapper}>
      <Sidebar />
      <div className={styles.main}>
        <Header />
        
        <div className={styles.content}>
          {/* Professional Header */}
          <div className={styles.pageHeader}>
            <div className={styles.headerLeft}>
              <h1 className={styles.pageTitle}>Investment Portfolio</h1>
              <p className={styles.pageSubtitle}>Comprehensive view of your investment performance and holdings</p>
            </div>
            <div className={styles.headerRight}>
              <button className={styles.primaryBtn}>
                <span>📈</span> Trade
              </button>
              <button className={styles.secondaryBtn}>
                <span>📊</span> Generate Report
              </button>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <span className={styles.metricLabel}>Portfolio Value</span>
                {isClient && <span className={styles.metricBadge}>LIVE</span>}
              </div>
              <div className={styles.metricValue}>
                ${(portfolioValue / 1000000).toFixed(2)}M
              </div>
              <div className={styles.metricFooter}>
                <span className={styles.metricChange}>
                  <span className={styles.changeIcon}>↑</span>
                  ${(totalReturn / 1000000).toFixed(2)}M
                </span>
                <span className={styles.metricPercent}>+{returnPercentage}%</span>
              </div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <span className={styles.metricLabel}>Today&apos;s Change</span>
              </div>
              <div className={styles.metricValue}>
                +$125,435
              </div>
              <div className={styles.metricFooter}>
                <span className={styles.metricChange}>
                  <span className={styles.changeIcon}>↑</span>
                  0.28%
                </span>
                <span className={styles.metricTime}>Market Hours</span>
              </div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <span className={styles.metricLabel}>Total Return</span>
              </div>
              <div className={styles.metricValue}>
                {returnPercentage}%
              </div>
              <div className={styles.metricFooter}>
                <span className={styles.metricChange}>
                  <span className={styles.changeIcon}>↑</span>
                  ${(totalReturn / 1000000).toFixed(2)}M
                </span>
                <span className={styles.metricTime}>Since 2003</span>
              </div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <span className={styles.metricLabel}>Annual Return</span>
              </div>
              <div className={styles.metricValue}>
                18.68%
              </div>
              <div className={styles.metricFooter}>
                <span className={styles.metricChange}>
                  <span className={styles.changeIcon}>↑</span>
                  Above Market
                </span>
                <span className={styles.metricTime}>20-Year Avg</span>
              </div>
            </div>
          </div>

          {/* Professional Tabs */}
          <div className={styles.tabContainer}>
            <div className={styles.tabs}>
              <button 
                className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'holdings' ? styles.active : ''}`}
                onClick={() => setActiveTab('holdings')}
              >
                Holdings
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'performance' ? styles.active : ''}`}
                onClick={() => setActiveTab('performance')}
              >
                Performance
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'analysis' ? styles.active : ''}`}
                onClick={() => setActiveTab('analysis')}
              >
                Analysis
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'transactions' ? styles.active : ''}`}
                onClick={() => setActiveTab('transactions')}
              >
                Transactions
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className={styles.tabContent}>
            {activeTab === 'overview' && (
              <>
                {isClient && (
                  <div className={styles.overviewGrid}>
                    {/* Asset Allocation Chart */}
                    <div className={styles.chartCard}>
                      <h2 className={styles.cardTitle}>Asset Allocation</h2>
                      <div className={styles.chartContainer}>
                        <Doughnut data={doughnutData} options={doughnutOptions} />
                      </div>
                    </div>

                    {/* Performance Chart */}
                    <div className={styles.chartCard}>
                      <h2 className={styles.cardTitle}>Portfolio Performance</h2>
                      <div className={styles.chartContainer}>
                        <Line data={performanceData} options={chartOptions} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Holdings Table */}
                <div className={styles.holdingsSection}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Top Holdings</h2>
                    <div className={styles.sectionActions}>
                      <input 
                        type="text" 
                        placeholder="Search holdings..." 
                        className={styles.searchInput}
                      />
                      <button className={styles.filterBtn}>Filter</button>
                    </div>
                  </div>
                  
                  <div className={styles.tableContainer}>
                    <table className={styles.holdingsTable}>
                      <thead>
                        <tr>
                          <th>Symbol</th>
                          <th>Name</th>
                          <th>Shares</th>
                          <th>Avg Cost</th>
                          <th>Current Price</th>
                          <th>Market Value</th>
                          <th>Total Gain/Loss</th>
                          <th>Total %</th>
                          <th>Day Change</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {holdings.map((holding) => (
                          <tr key={holding.symbol}>
                            <td className={styles.symbolCell}>
                              <div className={styles.symbolWrapper}>
                                <span className={styles.symbol}>{holding.symbol}</span>
                              </div>
                            </td>
                            <td className={styles.nameCell}>{holding.name}</td>
                            <td className={styles.numberCell}>{holding.shares.toLocaleString()}</td>
                            <td className={styles.numberCell}>${holding.avgCost.toFixed(2)}</td>
                            <td className={styles.numberCell}>
                              <strong>${holding.currentPrice.toFixed(2)}</strong>
                            </td>
                            <td className={styles.valueCell}>
                              <strong>${holding.value.toLocaleString()}</strong>
                            </td>
                            <td className={`${styles.numberCell} ${styles.gainCell}`}>
                              <span className={styles.gain}>
                                +${holding.gain.toLocaleString()}
                              </span>
                            </td>
                            <td className={`${styles.numberCell} ${styles.gainCell}`}>
                              <span className={styles.gainPercent}>
                                +{holding.gainPercent.toFixed(2)}%
                              </span>
                            </td>
                            <td className={styles.numberCell}>
                              <span className={holding.dayChange >= 0 ? styles.dayGain : styles.dayLoss}>
                                {holding.dayChange >= 0 ? '+' : ''}{holding.dayChangePercent.toFixed(2)}%
                              </span>
                            </td>
                            <td className={styles.actionCell}>
                              <button className={styles.tradeBtn}>Trade</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'holdings' && (
              <div className={styles.holdingsSection}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>All Holdings</h2>
                  <div className={styles.sectionActions}>
                    <input 
                      type="text" 
                      placeholder="Search holdings..." 
                      className={styles.searchInput}
                    />
                    <button className={styles.filterBtn}>Filter</button>
                  </div>
                </div>
                
                <div className={styles.tableContainer}>
                  <table className={styles.holdingsTable}>
                    <thead>
                      <tr>
                        <th>Symbol</th>
                        <th>Name</th>
                        <th>Shares</th>
                        <th>Avg Cost</th>
                        <th>Current Price</th>
                        <th>Market Value</th>
                        <th>Total Gain/Loss</th>
                        <th>Total %</th>
                        <th>Day Change</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holdings.map((holding) => (
                        <tr key={holding.symbol}>
                          <td className={styles.symbolCell}>
                            <div className={styles.symbolWrapper}>
                              <span className={styles.symbol}>{holding.symbol}</span>
                            </div>
                          </td>
                          <td className={styles.nameCell}>{holding.name}</td>
                          <td className={styles.numberCell}>{holding.shares.toLocaleString()}</td>
                          <td className={styles.numberCell}>${holding.avgCost.toFixed(2)}</td>
                          <td className={styles.numberCell}>
                            <strong>${holding.currentPrice.toFixed(2)}</strong>
                          </td>
                          <td className={styles.valueCell}>
                            <strong>${holding.value.toLocaleString()}</strong>
                          </td>
                          <td className={`${styles.numberCell} ${styles.gainCell}`}>
                            <span className={styles.gain}>
                              +${holding.gain.toLocaleString()}
                            </span>
                          </td>
                          <td className={`${styles.numberCell} ${styles.gainCell}`}>
                            <span className={styles.gainPercent}>
                              +{holding.gainPercent.toFixed(2)}%
                            </span>
                          </td>
                          <td className={styles.numberCell}>
                            <span className={holding.dayChange >= 0 ? styles.dayGain : styles.dayLoss}>
                              {holding.dayChange >= 0 ? '+' : ''}{holding.dayChangePercent.toFixed(2)}%
                            </span>
                          </td>
                          <td className={styles.actionCell}>
                            <button className={styles.tradeBtn}>Trade</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className={styles.totalRow}>
                        <td colSpan={5}>Total</td>
                        <td className={styles.totalValue}>
                          <strong>${holdings.reduce((sum, h) => sum + h.value, 0).toLocaleString()}</strong>
                        </td>
                        <td className={styles.totalGain}>
                          <strong>+${holdings.reduce((sum, h) => sum + h.gain, 0).toLocaleString()}</strong>
                        </td>
                        <td colSpan={3}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'performance' && (
              <div className={styles.performanceSection}>
                <h2>Performance Analysis</h2>
                <p>Detailed performance metrics coming soon...</p>
              </div>
            )}

            {activeTab === 'analysis' && (
              <div className={styles.analysisSection}>
                <h2>Portfolio Analysis</h2>
                <p>Advanced analytics coming soon...</p>
              </div>
            )}

            {activeTab === 'transactions' && (
              <div className={styles.transactionsSection}>
                <h2>Investment Transactions</h2>
                <p>Transaction history coming soon...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}