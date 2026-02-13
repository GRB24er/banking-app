"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./cards.module.css";

interface Card {
  _id: string;
  cardReference: string;
  cardType: string;
  cardTier: string;
  cardNumberLast4?: string;
  cardholderName: string;
  expiryMonth?: string;
  expiryYear?: string;
  currency: string;
  status: string;
  spendingLimit: number;
  dailyLimit: number;
  monthlyLimit: number;
  currentMonthSpent: number;
  requestedAt: string;
  activatedAt?: string;
}

interface CardTier {
  name: string;
  color: string;
  dailyLimit: number;
  monthlyLimit: number;
  spendingLimit: number;
  fee: number;
}

interface RevealedCard {
  cardNumber: string;
  expiry: string;
  cvv: string;
  cardholderName: string;
}

export default function CardsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<Card[]>([]);
  const [tiers, setTiers] = useState<Record<string, CardTier>>({});
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showRevealModal, setShowRevealModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [revealedCard, setRevealedCard] = useState<RevealedCard | null>(null);
  const [revealLoading, setRevealLoading] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [requestForm, setRequestForm] = useState({
    cardType: "visa",
    cardTier: "standard",
    purpose: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      fetchData();
    }
  }, [status]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cardsRes, tiersRes] = await Promise.all([
        fetch("/api/cards"),
        fetch("/api/cards?action=tiers"),
      ]);

      const cardsData = await cardsRes.json();
      const tiersData = await tiersRes.json();

      if (cardsData.success) setCards(cardsData.cards || []);
      if (tiersData.success) setTiers(tiersData.tiers || {});
    } catch (err) {
      console.error("Error fetching cards:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCard = async () => {
    setRequesting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request",
          ...requestForm,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to request card");

      setSuccess("Card requested successfully! You will be notified once it's approved.");
      setShowRequestModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRequesting(false);
    }
  };

  const handleRevealCard = async (card: Card) => {
    setSelectedCard(card);
    setRevealLoading(true);
    setShowRevealModal(true);
    setRevealedCard(null);
    setError("");

    try {
      // Step 1: Generate reveal token
      const tokenRes = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_reveal_token",
          cardId: card._id,
        }),
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) throw new Error(tokenData.error || "Failed to generate token");

      // Step 2: Reveal card with token
      const revealRes = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reveal",
          cardId: card._id,
          token: tokenData.token,
        }),
      });

      const revealData = await revealRes.json();
      if (!revealRes.ok) throw new Error(revealData.error || "Failed to reveal card");

      setRevealedCard(revealData.cardDetails);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRevealLoading(false);
    }
  };

  const handleFreezeCard = async (cardId: string, action: "freeze" | "unfreeze") => {
    try {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, cardId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess(`Card ${action === "freeze" ? "frozen" : "unfrozen"} successfully`);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "#10b981";
      case "pending": return "#f59e0b";
      case "processing": return "#3b82f6";
      case "frozen": return "#6b7280";
      case "rejected": return "#ef4444";
      default: return "#6b7280";
    }
  };

  const getTierColor = (tier: string) => {
    return tiers[tier]?.color || "#64748b";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <Sidebar />
        <div className={styles.main}>
          <Header />
          <div className={styles.loadingScreen}>
            <div className={styles.spinner}></div>
            <p>Loading cards...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <Sidebar />
      <div className={styles.main}>
        <Header />
        <div className={styles.content}>
          {/* Page Header */}
          <div className={styles.pageHeader}>
            <div>
              <h1>Virtual Cards</h1>
              <p>Manage your virtual cards for secure online payments</p>
            </div>
            <button
              className={styles.requestBtn}
              onClick={() => setShowRequestModal(true)}
            >
              <span>+</span> Request New Card
            </button>
          </div>

          {/* Messages */}
          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}

          {/* Cards Grid */}
          {cards.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>💳</div>
              <h3>No Virtual Cards</h3>
              <p>Request your first virtual card to start making secure online purchases.</p>
              <button
                className={styles.requestBtn}
                onClick={() => setShowRequestModal(true)}
              >
                Request Virtual Card
              </button>
            </div>
          ) : (
            <div className={styles.cardsGrid}>
              {cards.map((card) => (
                <div key={card._id} className={styles.cardContainer}>
                  {/* Card Visual */}
                  <div
                    className={styles.cardVisual}
                    style={{
                      background: `linear-gradient(135deg, ${getTierColor(card.cardTier)} 0%, ${getTierColor(card.cardTier)}dd 100%)`,
                    }}
                  >
                    <div className={styles.cardHeader}>
                      <span className={styles.cardType}>{card.cardType.toUpperCase()}</span>
                      <span
                        className={styles.cardStatus}
                        style={{ background: getStatusColor(card.status) }}
                      >
                        {card.status}
                      </span>
                    </div>
                    <div className={styles.cardNumber}>
                      •••• •••• •••• {card.cardNumberLast4 || "****"}
                    </div>
                    <div className={styles.cardFooter}>
                      <div>
                        <span className={styles.cardLabel}>CARD HOLDER</span>
                        <span className={styles.cardValue}>{card.cardholderName}</span>
                      </div>
                      <div>
                        <span className={styles.cardLabel}>EXPIRES</span>
                        <span className={styles.cardValue}>
                          {card.expiryMonth && card.expiryYear
                            ? `${card.expiryMonth}/${card.expiryYear}`
                            : "--/--"}
                        </span>
                      </div>
                    </div>
                    <div className={styles.cardTierBadge}>
                      {tiers[card.cardTier]?.name || card.cardTier}
                    </div>
                  </div>

                  {/* Card Details */}
                  <div className={styles.cardDetails}>
                    <div className={styles.cardReference}>
                      Ref: {card.cardReference}
                    </div>

                    <div className={styles.limitsSection}>
                      <h4>Spending Limits</h4>
                      <div className={styles.limitRow}>
                        <span>Daily</span>
                        <span>{formatCurrency(card.dailyLimit)}</span>
                      </div>
                      <div className={styles.limitRow}>
                        <span>Monthly</span>
                        <span>{formatCurrency(card.monthlyLimit)}</span>
                      </div>
                      <div className={styles.limitRow}>
                        <span>This Month</span>
                        <span>{formatCurrency(card.currentMonthSpent)}</span>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className={styles.cardActions}>
                      {card.status === "active" && (
                        <>
                          <button
                            className={styles.revealBtn}
                            onClick={() => handleRevealCard(card)}
                          >
                            👁 Reveal Details
                          </button>
                          <button
                            className={styles.freezeBtn}
                            onClick={() => handleFreezeCard(card._id, "freeze")}
                          >
                            🔒 Freeze
                          </button>
                        </>
                      )}
                      {card.status === "frozen" && (
                        <button
                          className={styles.unfreezeBtn}
                          onClick={() => handleFreezeCard(card._id, "unfreeze")}
                        >
                          🔓 Unfreeze
                        </button>
                      )}
                      {card.status === "pending" && (
                        <div className={styles.pendingMessage}>
                          ⏳ Awaiting admin approval
                        </div>
                      )}
                      {card.status === "processing" && (
                        <div className={styles.processingMessage}>
                          ⚙️ Being processed
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <Footer />
      </div>

      {/* Request Card Modal */}
      {showRequestModal && (
        <div className={styles.modalOverlay} onClick={() => setShowRequestModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Request Virtual Card</h2>
              <button onClick={() => setShowRequestModal(false)}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Card Network</label>
                <div className={styles.cardTypeOptions}>
                  <button
                    className={`${styles.cardTypeBtn} ${requestForm.cardType === "visa" ? styles.active : ""}`}
                    onClick={() => setRequestForm({ ...requestForm, cardType: "visa" })}
                  >
                    VISA
                  </button>
                  <button
                    className={`${styles.cardTypeBtn} ${requestForm.cardType === "mastercard" ? styles.active : ""}`}
                    onClick={() => setRequestForm({ ...requestForm, cardType: "mastercard" })}
                  >
                    MASTERCARD
                  </button>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Card Tier</label>
                <div className={styles.tierOptions}>
                  {Object.entries(tiers).map(([key, tier]) => (
                    <div
                      key={key}
                      className={`${styles.tierOption} ${requestForm.cardTier === key ? styles.active : ""}`}
                      onClick={() => setRequestForm({ ...requestForm, cardTier: key })}
                      style={{ borderColor: requestForm.cardTier === key ? tier.color : undefined }}
                    >
                      <div className={styles.tierColor} style={{ background: tier.color }}></div>
                      <div className={styles.tierInfo}>
                        <span className={styles.tierName}>{tier.name}</span>
                        <span className={styles.tierLimits}>
                          Daily: {formatCurrency(tier.dailyLimit)} | Monthly: {formatCurrency(tier.monthlyLimit)}
                        </span>
                      </div>
                      <div className={styles.tierFee}>
                        {tier.fee === 0 ? "Free" : `$${tier.fee}/mo`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Purpose (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., Online shopping, Subscriptions"
                  value={requestForm.purpose}
                  onChange={(e) => setRequestForm({ ...requestForm, purpose: e.target.value })}
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.cancelBtn}
                onClick={() => setShowRequestModal(false)}
              >
                Cancel
              </button>
              <button
                className={styles.submitBtn}
                onClick={handleRequestCard}
                disabled={requesting}
              >
                {requesting ? "Requesting..." : "Request Card"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reveal Card Modal */}
      {showRevealModal && (
        <div className={styles.modalOverlay} onClick={() => setShowRevealModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Card Details</h2>
              <button onClick={() => setShowRevealModal(false)}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              {revealLoading ? (
                <div className={styles.revealLoading}>
                  <div className={styles.spinner}></div>
                  <p>Securely retrieving card details...</p>
                </div>
              ) : revealedCard ? (
                <div className={styles.revealedCard}>
                  <div className={styles.securityWarning}>
                    🔒 These details are shown once. Do not share with anyone.
                  </div>
                  <div className={styles.revealField}>
                    <label>Card Number</label>
                    <div className={styles.revealValue}>
                      {revealedCard.cardNumber}
                      <button
                        onClick={() => navigator.clipboard.writeText(revealedCard.cardNumber.replace(/\s/g, ""))}
                      >
                        📋
                      </button>
                    </div>
                  </div>
                  <div className={styles.revealRow}>
                    <div className={styles.revealField}>
                      <label>Expiry Date</label>
                      <div className={styles.revealValue}>{revealedCard.expiry}</div>
                    </div>
                    <div className={styles.revealField}>
                      <label>CVV</label>
                      <div className={styles.revealValue}>
                        {revealedCard.cvv}
                        <button onClick={() => navigator.clipboard.writeText(revealedCard.cvv)}>
                          📋
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className={styles.revealField}>
                    <label>Cardholder Name</label>
                    <div className={styles.revealValue}>{revealedCard.cardholderName}</div>
                  </div>
                </div>
              ) : (
                <div className={styles.revealError}>
                  {error || "Failed to reveal card details"}
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowRevealModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
