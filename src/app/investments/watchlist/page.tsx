"use client";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import styles from "./watchlist.module.css";

export default function WatchlistPage() {
  const [selectedTab, setSelectedTab] = useState('watchlist');
  
  const watchlistItems = [
    { symbol: "AAPL", name: "Apple Inc.", price: 189.25, change: 2.34, changePercent: 1.24, volume: "52.3M", marketCap: "2.95T" },
    { symbol: "GOOGL", name: "Alphabet Inc.", price: 142.65, change: -1.23, changePercent: -0.86, volume: "28.1M", marketCap: "1.82T" },
    { symbol: "MSFT", name: "Microsoft", price: 378.85, change: 5.67, changePercent: 1.52, volume: "22.8M", marketCap: "2.81T" },
    { symbol: "AMZN", name: "Amazon", price: 178.35, change: 3.45, changePercent: 1.97, volume: "38.5M", marketCap: "1.85T" },
    { symbol: "TSLA", name: "Tesla Inc.", price: 248.50, change: -8.90, changePercent: -3.46, volume: "118.2M", marketCap: "789B" },
    { symbol: "META", name: "Meta Platforms", price: 505.33, change: 12.45, changePercent: 2.52, volume: "16.3M", marketCap: "1.29T" }
  ];

  return (
    <div className={styles.wrapper}>
      <Sidebar />
      <div className={styles.main}>
        <Header />
        
        <div className={styles.content}>
          <div className={styles.pageHeader}>
            <h1>Investment Watchlist</h1>
            <div className={styles.headerActions}>
              <button className={styles.addBtn}>+ Add Symbol</button>
              <button className={styles.editBtn}>Edit List</button>
            </div>
          </div>

          <div className={styles.watchlistGrid}>
            {watchlistItems.map(item => (
              <div key={item.symbol} className={styles.watchlistCard}>
                <div className={styles.cardHeader}>
                  <div>
                    <div className={styles.symbol}>{item.symbol}</div>
                    <div className={styles.companyName}>{item.name}</div>
                  </div>
                  <button className={styles.tradeBtn}>Trade</button>
                </div>
                
                <div className={styles.priceSection}>
                  <div className={styles.currentPrice}>${item.price}</div>
                  <div className={item.change >= 0 ? styles.changePositive : styles.changeNegative}>
                    {item.change >= 0 ? '+' : ''}{item.change} ({item.changePercent}%)
                  </div>
                </div>
                
                <div className={styles.statsGrid}>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Volume</span>
                    <span className={styles.statValue}>{item.volume}</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Market Cap</span>
                    <span className={styles.statValue}>{item.marketCap}</span>
                  </div>
                </div>
                
                <div className={styles.cardActions}>
                  <button className={styles.actionBtn}>📊 Chart</button>
                  <button className={styles.actionBtn}>📰 News</button>
                  <button className={styles.actionBtn}>🔔 Alert</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}