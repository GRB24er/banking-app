"use client";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import styles from "./research.module.css";

export default function ResearchPage() {
  const [activeCategory, setActiveCategory] = useState('all');

  const researchReports = [
    {
      id: 1,
      title: "Tech Sector Analysis Q4 2024",
      author: "Morgan Stanley Research",
      date: "Aug 15, 2025",
      category: "Technology",
      rating: "Buy",
      summary: "Strong growth expected in AI and cloud computing sectors...",
      tags: ["AI", "Cloud", "Growth"]
    },
    {
      id: 2,
      title: "Federal Reserve Policy Impact",
      author: "Goldman Sachs",
      date: "Aug 14, 2025",
      category: "Macro",
      rating: "Neutral",
      summary: "Analysis of recent Fed decisions and market implications...",
      tags: ["Fed", "Rates", "Policy"]
    },
    {
      id: 3,
      title: "Energy Sector Transition Report",
      author: "JP Morgan",
      date: "Aug 13, 2025",
      category: "Energy",
      rating: "Hold",
      summary: "Renewable energy investments accelerating globally...",
      tags: ["Energy", "ESG", "Renewable"]
    }
  ];

  const marketInsights = [
    { metric: "S&P 500 Target", value: "5,800", change: "+5.7%" },
    { metric: "GDP Growth", value: "2.3%", change: "Stable" },
    { metric: "Inflation Rate", value: "3.2%", change: "-0.3%" },
    { metric: "10Y Treasury", value: "4.25%", change: "+0.05%" }
  ];

  return (
    <div className={styles.wrapper}>
      <Sidebar />
      <div className={styles.main}>
        <Header />
        
        <div className={styles.content}>
          <div className={styles.pageHeader}>
            <h1>Investment Research</h1>
            <div className={styles.searchBar}>
              <input type="text" placeholder="Search research reports..." />
              <button>🔍</button>
            </div>
          </div>

          {/* Market Insights */}
          <div className={styles.insightsSection}>
            <h2>Market Insights</h2>
            <div className={styles.insightsGrid}>
              {marketInsights.map((insight, idx) => (
                <div key={idx} className={styles.insightCard}>
                  <div className={styles.insightMetric}>{insight.metric}</div>
                  <div className={styles.insightValue}>{insight.value}</div>
                  <div className={styles.insightChange}>{insight.change}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div className={styles.categoryFilter}>
            <button 
              className={activeCategory === 'all' ? styles.active : ''}
              onClick={() => setActiveCategory('all')}
            >
              All Research
            </button>
            <button 
              className={activeCategory === 'technology' ? styles.active : ''}
              onClick={() => setActiveCategory('technology')}
            >
              Technology
            </button>
            <button 
              className={activeCategory === 'macro' ? styles.active : ''}
              onClick={() => setActiveCategory('macro')}
            >
              Macro
            </button>
            <button 
              className={activeCategory === 'energy' ? styles.active : ''}
              onClick={() => setActiveCategory('energy')}
            >
              Energy
            </button>
          </div>

          {/* Research Reports */}
          <div className={styles.reportsSection}>
            <h2>Latest Research Reports</h2>
            <div className={styles.reportsList}>
              {researchReports.map(report => (
                <div key={report.id} className={styles.reportCard}>
                  <div className={styles.reportHeader}>
                    <div>
                      <h3>{report.title}</h3>
                      <div className={styles.reportMeta}>
                        <span>{report.author}</span>
                        <span>•</span>
                        <span>{report.date}</span>
                      </div>
                    </div>
                    <div className={`${styles.rating} ${styles[report.rating.toLowerCase()]}`}>
                      {report.rating}
                    </div>
                  </div>
                  <p className={styles.reportSummary}>{report.summary}</p>
                  <div className={styles.reportFooter}>
                    <div className={styles.tags}>
                      {report.tags.map(tag => (
                        <span key={tag} className={styles.tag}>{tag}</span>
                      ))}
                    </div>
                    <button className={styles.readBtn}>Read Full Report →</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}