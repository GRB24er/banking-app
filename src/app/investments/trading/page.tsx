"use client";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import styles from "./trading.module.css";

export default function TradingPage() {
  const [orderType, setOrderType] = useState('buy');
  const [tradeType, setTradeType] = useState('market');
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');

  const portfolio = [
    { symbol: "AAPL", shares: 5000, avgCost: 145.50, currentPrice: 189.25, value: 946250, gain: 218750, gainPercent: 30.09 },
    { symbol: "MSFT", shares: 3500, avgCost: 285.25, currentPrice: 378.85, value: 1325975, gain: 327600, gainPercent: 32.82 },
    { symbol: "GOOGL", shares: 2000, avgCost: 125.40, currentPrice: 142.65, value: 285300, gain: 34500, gainPercent: 13.74 },
    { symbol: "AMZN", shares: 4000, avgCost: 98.75, currentPrice: 178.35, value: 713400, gain: 318400, gainPercent: 80.61 }
  ];

  const recentTrades = [
    { id: 1, type: "BUY", symbol: "NVDA", shares: 500, price: 485.50, total: 242750, time: "10:45 AM", status: "Executed" },
    { id: 2, type: "SELL", symbol: "TSLA", shares: 200, price: 248.50, total: 49700, time: "10:30 AM", status: "Executed" },
    { id: 3, type: "BUY", symbol: "META", shares: 300, price: 505.33, total: 151599, time: "9:45 AM", status: "Executed" },
    { id: 4, type: "SELL", symbol: "AMD", shares: 1000, price: 125.75, total: 125750, time: "9:30 AM", status: "Executed" }
  ];

  const marketData = {
    AAPL: { price: 189.25, change: 2.34, changePercent: 1.24, bid: 189.24, ask: 189.26, volume: "52.3M" },
    MSFT: { price: 378.85, change: 5.67, changePercent: 1.52, bid: 378.84, ask: 378.86, volume: "22.8M" },
    GOOGL: { price: 142.65, change: -1.23, changePercent: -0.86, bid: 142.64, ask: 142.66, volume: "28.1M" }
  };

  const calculateOrderTotal = () => {
    const qty = parseFloat(quantity) || 0;
    const prc = tradeType === 'market' 
      ? marketData[selectedSymbol as keyof typeof marketData]?.price || 0
      : parseFloat(price) || 0;
    return (qty * prc).toFixed(2);
  };

  return (
    <div className={styles.wrapper}>
      <Sidebar />
      <div className={styles.main}>
        <Header />
        
        <div className={styles.content}>
          <div className={styles.pageHeader}>
            <h1>Trading Platform</h1>
            <div className={styles.accountInfo}>
              <span>Buying Power: <strong>$2,500,000</strong></span>
              <span>Portfolio Value: <strong>$45.46M</strong></span>
            </div>
          </div>

          <div className={styles.tradingLayout}>
            {/* Order Form */}
            <div className={styles.orderSection}>
              <div className={styles.orderCard}>
                <h2>Place Order</h2>
                
                {/* Buy/Sell Toggle */}
                <div className={styles.orderTypeToggle}>
                  <button 
                    className={orderType === 'buy' ? styles.buyActive : ''}
                    onClick={() => setOrderType('buy')}
                  >
                    BUY
                  </button>
                  <button 
                    className={orderType === 'sell' ? styles.sellActive : ''}
                    onClick={() => setOrderType('sell')}
                  >
                    SELL
                  </button>
                </div>

                {/* Symbol Selection */}
                <div className={styles.formGroup}>
                  <label>Symbol</label>
                  <select 
                    value={selectedSymbol} 
                    onChange={(e) => setSelectedSymbol(e.target.value)}
                    className={styles.symbolSelect}
                  >
                    <option value="AAPL">AAPL - Apple Inc.</option>
                    <option value="MSFT">MSFT - Microsoft</option>
                    <option value="GOOGL">GOOGL - Alphabet</option>
                    <option value="AMZN">AMZN - Amazon</option>
                  </select>
                </div>

                {/* Order Type */}
                <div className={styles.formGroup}>
                  <label>Order Type</label>
                  <div className={styles.radioGroup}>
                    <label>
                      <input 
                        type="radio" 
                        value="market" 
                        checked={tradeType === 'market'}
                        onChange={(e) => setTradeType(e.target.value)}
                      />
                      Market Order
                    </label>
                    <label>
                      <input 
                        type="radio" 
                        value="limit" 
                        checked={tradeType === 'limit'}
                        onChange={(e) => setTradeType(e.target.value)}
                      />
                      Limit Order
                    </label>
                  </div>
                </div>

                {/* Quantity */}
                <div className={styles.formGroup}>
                  <label>Quantity</label>
                  <input 
                    type="number" 
                    placeholder="Number of shares"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className={styles.input}
                  />
                </div>

                {/* Price (for limit orders) */}
                {tradeType === 'limit' && (
                  <div className={styles.formGroup}>
                    <label>Limit Price</label>
                    <input 
                      type="number" 
                      placeholder="0.00"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className={styles.input}
                    />
                  </div>
                )}

                {/* Order Summary */}
                <div className={styles.orderSummary}>
                  <div className={styles.summaryRow}>
                    <span>Market Price:</span>
                    <span>${marketData[selectedSymbol as keyof typeof marketData]?.price.toFixed(2)}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Shares:</span>
                    <span>{quantity || '0'}</span>
                  </div>
                  <div className={styles.summaryTotal}>
                    <span>Estimated Total:</span>
                    <span>${calculateOrderTotal()}</span>
                  </div>
                </div>

                {/* Submit Button */}
                <button 
                  className={`${styles.submitOrder} ${orderType === 'buy' ? styles.buyBtn : styles.sellBtn}`}
                >
                  {orderType === 'buy' ? 'Place Buy Order' : 'Place Sell Order'}
                </button>
              </div>

              {/* Market Data */}
              <div className={styles.marketDataCard}>
                <h3>Market Data - {selectedSymbol}</h3>
                <div className={styles.marketStats}>
                  <div className={styles.statRow}>
                    <span>Current Price:</span>
                    <span className={styles.price}>
                      ${marketData[selectedSymbol as keyof typeof marketData]?.price.toFixed(2)}
                    </span>
                  </div>
                  <div className={styles.statRow}>
                    <span>Change:</span>
                    <span className={
                      marketData[selectedSymbol as keyof typeof marketData]?.change >= 0 
                        ? styles.positive 
                        : styles.negative
                    }>
                      {marketData[selectedSymbol as keyof typeof marketData]?.change >= 0 ? '+' : ''}
                      {marketData[selectedSymbol as keyof typeof marketData]?.changePercent}%
                    </span>
                  </div>
                  <div className={styles.statRow}>
                    <span>Bid/Ask:</span>
                    <span>
                      ${marketData[selectedSymbol as keyof typeof marketData]?.bid} / 
                      ${marketData[selectedSymbol as keyof typeof marketData]?.ask}
                    </span>
                  </div>
                  <div className={styles.statRow}>
                    <span>Volume:</span>
                    <span>{marketData[selectedSymbol as keyof typeof marketData]?.volume}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Portfolio & Recent Trades */}
            <div className={styles.dataSection}>
              {/* Current Holdings */}
              <div className={styles.holdingsCard}>
                <h2>Current Holdings</h2>
                <div className={styles.holdingsTable}>
                  <table>
                    <thead>
                      <tr>
                        <th>Symbol</th>
                        <th>Shares</th>
                        <th>Avg Cost</th>
                        <th>Current</th>
                        <th>Value</th>
                        <th>Gain/Loss</th>
                        <th>%</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portfolio.map((holding, idx) => (
                        <tr key={idx}>
                          <td className={styles.symbol}>{holding.symbol}</td>
                          <td>{holding.shares.toLocaleString()}</td>
                          <td>${holding.avgCost.toFixed(2)}</td>
                          <td>${holding.currentPrice.toFixed(2)}</td>
                          <td className={styles.value}>${holding.value.toLocaleString()}</td>
                          <td className={styles.positive}>+${holding.gain.toLocaleString()}</td>
                          <td className={styles.positive}>+{holding.gainPercent}%</td>
                          <td>
                            <button className={styles.tradeBtn}>Trade</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Trades */}
              <div className={styles.tradesCard}>
                <h2>Recent Trades</h2>
                <div className={styles.tradesList}>
                  {recentTrades.map(trade => (
                    <div key={trade.id} className={styles.tradeItem}>
                      <div className={styles.tradeHeader}>
                        <span className={`${styles.tradeType} ${trade.type === 'BUY' ? styles.buy : styles.sell}`}>
                          {trade.type}
                        </span>
                        <span className={styles.tradeSymbol}>{trade.symbol}</span>
                        <span className={styles.tradeTime}>{trade.time}</span>
                      </div>
                      <div className={styles.tradeDetails}>
                        <span>{trade.shares} shares @ ${trade.price}</span>
                        <span className={styles.tradeTotal}>${trade.total.toLocaleString()}</span>
                      </div>
                      <div className={styles.tradeStatus}>
                        <span className={styles.executed}>{trade.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}