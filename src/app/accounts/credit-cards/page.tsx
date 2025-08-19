"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import styles from "./creditCards.module.css";

export default function CreditCardsPage() {
  const { data: session } = useSession();

  const cards = [
    {
      id: 1,
      name: "Horizon Platinum",
      number: "****4532",
      balance: 2845.50,
      limit: 15000,
      available: 12154.50,
      dueDate: "2025-09-10",
      minPayment: 85.00,
      apr: "18.99%",
      rewards: 4532,
      type: "visa"
    },
    {
      id: 2,
      name: "Horizon Cashback",
      number: "****7891",
      balance: 450.00,
      limit: 8000,
      available: 7550.00,
      dueDate: "2025-09-15",
      minPayment: 25.00,
      apr: "21.99%",
      rewards: 156,
      type: "mastercard"
    }
  ];

  return (
    <div className={styles.wrapper}>
      <Sidebar />
      <div className={styles.main}>
        <Header />
        
        <div className={styles.content}>
          <div className={styles.pageHeader}>
            <h1>Credit Cards</h1>
            <button className={styles.applyBtn}>Apply for New Card</button>
          </div>

          <div className={styles.cardsGrid}>
            {cards.map(card => (
              <div key={card.id} className={styles.cardContainer}>
                <div className={styles.creditCard}>
                  <div className={styles.cardType}>{card.type.toUpperCase()}</div>
                  <div className={styles.cardChip}></div>
                  <div className={styles.cardNumber}>{card.number}</div>
                  <div className={styles.cardName}>{card.name}</div>
                </div>

                <div className={styles.cardDetails}>
                  <div className={styles.balanceSection}>
                    <div className={styles.detailRow}>
                      <span>Current Balance</span>
                      <strong>${card.balance.toLocaleString()}</strong>
                    </div>
                    <div className={styles.detailRow}>
                      <span>Available Credit</span>
                      <strong className={styles.available}>
                        ${card.available.toLocaleString()}
                      </strong>
                    </div>
                    <div className={styles.detailRow}>
                      <span>Credit Limit</span>
                      <strong>${card.limit.toLocaleString()}</strong>
                    </div>
                  </div>

                  <div className={styles.usageBar}>
                    <div 
                      className={styles.usageFill}
                      style={{ width: `${(card.balance / card.limit) * 100}%` }}
                    ></div>
                  </div>

                  <div className={styles.paymentInfo}>
                    <div className={styles.detailRow}>
                      <span>Payment Due</span>
                      <strong>{card.dueDate}</strong>
                    </div>
                    <div className={styles.detailRow}>
                      <span>Minimum Payment</span>
                      <strong>${card.minPayment}</strong>
                    </div>
                  </div>

                  <div className={styles.cardActions}>
                    <button className={styles.payBtn}>Make Payment</button>
                    <button className={styles.detailsBtn}>View Details</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}