// app/cards/credit/page.tsx
"use client";

import styles from "./credit.module.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Sidebar from "@/components/Sidebar";

export default function CreditCardsPage() {
  const creditCards = [
    {
      name: "Horizon Rewards Platinum",
      annualFee: "$95",
      apr: "16.99% - 24.99%",
      rewards: "3% cash back on dining, 2% on gas, 1% on everything else",
      signupBonus: "Earn $200 after spending $1,000 in first 3 months",
      features: [
        "No foreign transaction fees",
        "Travel insurance coverage",
        "Extended warranty protection",
        "Purchase protection",
        "24/7 concierge service"
      ]
    },
    {
      name: "Horizon Cash Back",
      annualFee: "$0",
      apr: "14.99% - 22.99%",
      rewards: "1.5% cash back on all purchases",
      signupBonus: "0% APR for 15 months on balance transfers",
      features: [
        "No annual fee",
        "Simple cash back program",
        "Mobile wallet compatible",
        "Free FICO score access",
        "Fraud protection"
      ]
    },
    {
      name: "Horizon Business Elite",
      annualFee: "$195",
      apr: "15.99% - 23.99%",
      rewards: "4% on business purchases, 2% on all other",
      signupBonus: "70,000 bonus points after $5,000 spend",
      features: [
        "Employee cards at no extra cost",
        "Expense management tools",
        "Higher credit limits",
        "Quarterly expense reports",
        "Business insurance benefits"
      ]
    }
  ];

  return (
    <div className={styles.wrapper}>
      <Sidebar />
      <div className={styles.mainContent}>
        <Header />
        
        <section className={styles.hero}>
          <h1>Credit Cards That Reward Your Lifestyle</h1>
          <p>Choose from cash back, travel rewards, or business credit cards</p>
        </section>

        <section className={styles.cardsGrid}>
          {creditCards.map((card, index) => (
            <div key={index} className={styles.card}>
              <h2>{card.name}</h2>
              <div className={styles.cardDetails}>
                <p><strong>Annual Fee:</strong> {card.annualFee}</p>
                <p><strong>APR:</strong> {card.apr}</p>
                <p><strong>Rewards:</strong> {card.rewards}</p>
                <p className={styles.bonus}>{card.signupBonus}</p>
              </div>
              <div className={styles.features}>
                <h3>Card Benefits:</h3>
                <ul>
                  {card.features.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
              </div>
              <button className={styles.applyButton}>Apply Now</button>
            </div>
          ))}
        </section>

        <Footer />
      </div>
    </div>
  );
}