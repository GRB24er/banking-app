"use client";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import styles from "./cards.module.css";

export default function CardsPage() {
  const [selectedCard, setSelectedCard] = useState(0);

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
      color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
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
      color: "linear-gradient(135deg, #10b981 0%, #059669 100%)"
    }
  ];

  return (
    <div className={styles.wrapper}>
      <Sidebar />
      <div className={styles.main}>
        <Header />
        
        <div className={styles.content}>
          <div className={styles.pageHeader}>
            <h1>My Cards</h1>
            <button className={styles.requestCardBtn}>Request New Card</button>
          </div>

          <div className={styles.cardsDisplay}>
            <div className={styles.cardShowcase}>
              <div 
                className={styles.cardVisual}
                style={{ background: cards[selectedCard].color }}
              >
                <div className={styles.cardChip}></div>
                <div className={styles.cardLogo}>HORIZON</div>
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

              <div className={styles.cardSelector}>
                {cards.map((card, index) => (
                  <button
                    key={card.id}
                    className={selectedCard === index ? styles.selected : ''}
                    onClick={() => setSelectedCard(index)}
                  >
                    {card.name}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.cardInfo}>
              <h3>Card Details</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span>Card Type</span>
                  <strong>{cards[selectedCard].type}</strong>
                </div>
                <div className={styles.infoItem}>
                  <span>Status</span>
                  <strong className={styles.active}>{cards[selectedCard].status}</strong>
                </div>
                <div className={styles.infoItem}>
                  <span>Linked Account</span>
                  <strong>{cards[selectedCard].linked}</strong>
                </div>
                <div className={styles.infoItem}>
                  <span>Available Balance</span>
                  <strong>${cards[selectedCard].balance.toLocaleString()}</strong>
                </div>
              </div>

              <div className={styles.cardActions}>
                <button className={styles.actionBtn}>
                  <span>🔒</span> Lock Card
                </button>
                <button className={styles.actionBtn}>
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

          <div className={styles.recentActivity}>
            <h3>Recent Card Activity</h3>
            <div className={styles.activityList}>
              <div className={styles.activityItem}>
                <div className={styles.activityIcon}>🛒</div>
                <div className={styles.activityDetails}>
                  <div className={styles.activityName}>Walmart Supercenter</div>
                  <div className={styles.activityDate}>Today, 2:45 PM</div>
                </div>
                <div className={styles.activityAmount}>-$125.50</div>
              </div>
              <div className={styles.activityItem}>
                <div className={styles.activityIcon}>⛽</div>
                <div className={styles.activityDetails}>
                  <div className={styles.activityName}>Shell Gas Station</div>
                  <div className={styles.activityDate}>Yesterday, 5:30 PM</div>
                </div>
                <div className={styles.activityAmount}>-$65.00</div>
              </div>
              <div className={styles.activityItem}>
                <div className={styles.activityIcon}>🍔</div>
                <div className={styles.activityDetails}>
                  <div className={styles.activityName}>McDonald's</div>
                  <div className={styles.activityDate}>Aug 16, 12:15 PM</div>
                </div>
                <div className={styles.activityAmount}>-$18.75</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}