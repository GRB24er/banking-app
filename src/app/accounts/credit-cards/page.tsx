"use client";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import styles from "./cards.module.css";

export default function CardsPage() {
  const [selectedCard, setSelectedCard] = useState(0);
  const [showPinModal, setShowPinModal] = useState(false);

  const cards = [
    {
      id: 1,
      type: "Debit",
      name: "Horizon Premier",
      number: "4532 •••• •••• 1234",
      expiry: "08/27",
      cvv: "•••",
      balance: 4000.00,
      status: "Active",
      linked: "Checking Account",
      color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      transactions: 142,
      cashback: 245.50
    },
    {
      id: 2,
      type: "Debit",
      name: "Horizon Savings",
      number: "4532 •••• •••• 5678",
      expiry: "10/28",
      cvv: "•••",
      balance: 1000.00,
      status: "Active",
      linked: "Savings Account",
      color: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      transactions: 28,
      cashback: 15.75
    }
  ];

  const recentActivity = [
    { id: 1, merchant: "Walmart Supercenter", category: "Shopping", amount: -125.50, date: "Today, 2:45 PM", status: "Completed" },
    { id: 2, merchant: "Shell Gas Station", category: "Fuel", amount: -65.00, date: "Yesterday, 5:30 PM", status: "Completed" },
    { id: 3, merchant: "McDonald's", category: "Food", amount: -18.75, date: "Aug 16, 12:15 PM", status: "Completed" },
    { id: 4, merchant: "Amazon.com", category: "Shopping", amount: -299.99, date: "Aug 15, 8:20 AM", status: "Completed" },
    { id: 5, merchant: "Netflix", category: "Entertainment", amount: -15.99, date: "Aug 14, 12:00 AM", status: "Completed" }
  ];

  return (
    <div className={styles.wrapper}>
      <Sidebar />
      <div className={styles.main}>
        <Header />
        
        <div className={styles.content}>
          {/* Page Header */}
          <div className={styles.pageHeader}>
            <div className={styles.headerInfo}>
              <h1>Card Management</h1>
              <p>Manage your debit and credit cards</p>
            </div>
            <button className={styles.requestCardBtn}>
              <span>+</span> Request New Card
            </button>
          </div>

          {/* Card Display Section */}
          <div className={styles.cardSection}>
            <div className={styles.cardDisplay}>
              {/* Card Visual */}
              <div className={styles.cardVisualContainer}>
                <div 
                  className={styles.cardVisual}
                  style={{ background: cards[selectedCard].color }}
                >
                  <div className={styles.cardTop}>
                    <div className={styles.cardLogo}>HORIZON</div>
                    <div className={styles.cardType}>{cards[selectedCard].type}</div>
                  </div>
                  
                  <div className={styles.cardChip}></div>
                  
                  <div className={styles.cardNumber}>{cards[selectedCard].number}</div>
                  
                  <div className={styles.cardBottom}>
                    <div>
                      <div className={styles.cardLabel}>CARD HOLDER</div>
                      <div className={styles.cardValue}>HAJAND MORGAN</div>
                    </div>
                    <div>
                      <div className={styles.cardLabel}>EXPIRES</div>
                      <div className={styles.cardValue}>{cards[selectedCard].expiry}</div>
                    </div>
                  </div>
                </div>

                {/* Card Selector */}
                <div className={styles.cardSelector}>
                  {cards.map((card, index) => (
                    <button
                      key={card.id}
                      className={`${styles.selectorBtn} ${selectedCard === index ? styles.selected : ''}`}
                      onClick={() => setSelectedCard(index)}
                    >
                      <span className={styles.selectorDot}></span>
                      {card.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Info */}
              <div className={styles.cardInfo}>
                <h3>Card Details</h3>
                
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Card Type</span>
                    <span className={styles.infoValue}>{cards[selectedCard].type}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Status</span>
                    <span className={`${styles.infoValue} ${styles.statusActive}`}>
                      {cards[selectedCard].status}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Linked Account</span>
                    <span className={styles.infoValue}>{cards[selectedCard].linked}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Available Balance</span>
                    <span className={styles.infoValue}>
                      ${cards[selectedCard].balance.toLocaleString()}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Total Transactions</span>
                    <span className={styles.infoValue}>{cards[selectedCard].transactions}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Cashback Earned</span>
                    <span className={styles.infoValue}>
                      ${cards[selectedCard].cashback.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className={styles.cardActions}>
                  <button className={styles.actionBtn}>
                    <span>🔒</span> Lock Card
                  </button>
                  <button className={styles.actionBtn} onClick={() => setShowPinModal(true)}>
                    <span>📍</span> Set PIN
                  </button>
                  <button className={styles.actionBtn}>
                    <span>🌍</span> Travel Notice
                  </button>
                  <button className={styles.actionBtn}>
                    <span>📊</span> Spending Limits
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className={styles.activitySection}>
            <div className={styles.sectionHeader}>
              <h2>Recent Card Activity</h2>
              <button className={styles.viewAllBtn}>View All</button>
            </div>

            <div className={styles.activityTable}>
              <table>
                <thead>
                  <tr>
                    <th>Merchant</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.map(activity => (
                    <tr key={activity.id}>
                      <td>
                        <div className={styles.merchantInfo}>
                          <span className={styles.merchantIcon}>
                            {activity.category === 'Shopping' && '🛒'}
                            {activity.category === 'Fuel' && '⛽'}
                            {activity.category === 'Food' && '🍔'}
                            {activity.category === 'Entertainment' && '🎬'}
                          </span>
                          <span>{activity.merchant}</span>
                        </div>
                      </td>
                      <td>{activity.category}</td>
                      <td>{activity.date}</td>
                      <td className={activity.amount < 0 ? styles.debit : styles.credit}>
                        ${Math.abs(activity.amount).toFixed(2)}
                      </td>
                      <td>
                        <span className={styles.statusBadge}>{activity.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}