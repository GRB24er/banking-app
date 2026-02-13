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

// Visa SVG Logo
const VisaLogo = () => (
  <svg viewBox="0 0 780 500" className={styles.cardLogo}>
    <path d="M293.2 348.7l33.4-195.8h53.4l-33.4 195.8h-53.4zM540.7 159.6c-10.6-4-27.2-8.3-47.9-8.3-52.8 0-90 26.6-90.3 64.7-.3 28.2 26.5 43.9 46.8 53.3 20.8 9.6 27.8 15.7 27.7 24.3-.1 13.1-16.6 19.1-32 19.1-21.4 0-32.7-3-50.3-10.2l-6.9-3.1-7.5 43.8c12.5 5.5 35.6 10.2 59.6 10.5 56.1 0 92.5-26.3 92.9-67 .2-22.3-14-39.3-44.8-53.3-18.7-9.1-30.1-15.1-30-24.3 0-8.1 9.7-16.8 30.6-16.8 17.5-.3 30.1 3.5 40 7.5l4.8 2.3 7.3-42.5zM646.2 152.9h-41.3c-12.8 0-22.4 3.5-28 16.3l-79.4 179.5h56.1s9.2-24.2 11.3-29.5c6.1 0 60.5.1 68.3.1 1.6 6.9 6.5 29.4 6.5 29.4h49.6l-43.1-195.8zm-65.7 126.5c4.4-11.3 21.3-54.7 21.3-54.7-.3.5 4.4-11.3 7.1-18.7l3.6 16.9s10.2 46.9 12.4 56.5h-44.4zM235.1 152.9l-52.4 133.5-5.6-27.1c-9.7-31.2-40-65.1-73.8-82l47.8 171.3 56.5-.1 84-195.7h-56.5z" fill="#fff"/>
    <path d="M146.9 152.9H60.9l-.7 4c67 16.2 111.4 55.4 129.8 102.5l-18.7-90c-3.2-12.3-12.6-16.1-24.4-16.5z" fill="#F7B600"/>
  </svg>
);

// Mastercard SVG Logo
const MastercardLogo = () => (
  <svg viewBox="0 0 780 500" className={styles.cardLogo}>
    <circle cx="250" cy="250" r="150" fill="#EB001B"/>
    <circle cx="530" cy="250" r="150" fill="#F79E1B"/>
    <path d="M390 120.8c-46.5 36.8-76.2 93.7-76.2 157.2s29.7 120.4 76.2 157.2c46.5-36.8 76.2-93.7 76.2-157.2s-29.7-120.4-76.2-157.2z" fill="#FF5F00"/>
  </svg>
);

// Chip SVG
const ChipSVG = () => (
  <svg viewBox="0 0 50 40" className={styles.chip}>
    <rect x="0" y="0" width="50" height="40" rx="5" fill="url(#chipGradient)"/>
    <defs>
      <linearGradient id="chipGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFD700"/>
        <stop offset="50%" stopColor="#DAA520"/>
        <stop offset="100%" stopColor="#B8860B"/>
      </linearGradient>
    </defs>
    <line x1="0" y1="13" x2="50" y2="13" stroke="#B8860B" strokeWidth="2"/>
    <line x1="0" y1="27" x2="50" y2="27" stroke="#B8860B" strokeWidth="2"/>
    <line x1="17" y1="0" x2="17" y2="40" stroke="#B8860B" strokeWidth="2"/>
    <line x1="33" y1="0" x2="33" y2="40" stroke="#B8860B" strokeWidth="2"/>
  </svg>
);

// Contactless SVG
const ContactlessSVG = () => (
  <svg viewBox="0 0 24 24" className={styles.contactless}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="none"/>
    <path d="M7.5 12.5c1.5-1.5 3.5-2 5.5-1.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <path d="M6 15c2.5-2.5 6-3 9-2" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <path d="M4.5 17.5c3.5-3.5 8.5-4 12.5-2.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
  </svg>
);

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

  const getCardBackground = (cardType: string, cardTier: string) => {
    if (cardType === "visa") {
      switch (cardTier) {
        case "gold": return "linear-gradient(135deg, #1a1f71 0%, #2d3494 50%, #1a1f71 100%)";
        case "platinum": return "linear-gradient(135deg, #0f1419 0%, #2c3e50 50%, #0f1419 100%)";
        case "black": return "linear-gradient(135deg, #000000 0%, #1c1c1c 50%, #000000 100%)";
        default: return "linear-gradient(135deg, #1a1f71 0%, #00579f 100%)";
      }
    } else {
      switch (cardTier) {
        case "gold": return "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)";
        case "platinum": return "linear-gradient(135deg, #1c1c1c 0%, #363636 50%, #1c1c1c 100%)";
        case "black": return "linear-gradient(135deg, #000000 0%, #0d0d0d 50%, #000000 100%)";
        default: return "linear-gradient(135deg, #1a1a1a 0%, #333333 100%)";
      }
    }
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

          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}

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
                  {/* Realistic Card Design */}
                  <div
                    className={styles.cardVisual}
                    style={{ background: getCardBackground(card.cardType, card.cardTier) }}
                  >
                    {/* Top Row - Bank Name & Contactless */}
                    <div className={styles.cardTopRow}>
                      <div className={styles.bankName}>HORIZON GLOBAL CAPITAL</div>
                      <ContactlessSVG />
                    </div>

                    {/* Chip */}
                    <div className={styles.chipContainer}>
                      <ChipSVG />
                    </div>

                    {/* Card Number */}
                    <div className={styles.cardNumber}>
                      <span>••••</span>
                      <span>••••</span>
                      <span>••••</span>
                      <span>{card.cardNumberLast4 || "••••"}</span>
                    </div>

                    {/* Card Details Row */}
                    <div className={styles.cardDetailsRow}>
                      <div className={styles.cardHolder}>
                        <span className={styles.cardLabel}>CARD HOLDER</span>
                        <span className={styles.cardValue}>{card.cardholderName}</span>
                      </div>
                      <div className={styles.cardExpiry}>
                        <span className={styles.cardLabel}>VALID THRU</span>
                        <span className={styles.cardValue}>
                          {card.expiryMonth && card.expiryYear
                            ? `${card.expiryMonth}/${card.expiryYear}`
                            : "••/••"}
                        </span>
                      </div>
                    </div>

                    {/* Card Logo */}
                    <div className={styles.cardLogoContainer}>
                      {card.cardType === "visa" ? <VisaLogo /> : <MastercardLogo />}
                    </div>

                    {/* Status Badge */}
                    <div
                      className={styles.cardStatusBadge}
                      style={{ background: getStatusColor(card.status) }}
                    >
                      {card.status}
                    </div>

                    {/* Tier Badge */}
                    <div className={styles.tierBadge}>
                      {tiers[card.cardTier]?.name || card.cardTier}
                    </div>

                    {/* Hologram Effect */}
                    <div className={styles.hologram}></div>
                  </div>

                  {/* Card Info Section */}
                  <div className={styles.cardDetails}>
                    <div className={styles.cardReference}>
                      Ref: {card.cardReference}
                    </div>

                    <div className={styles.limitsSection}>
                      <h4>Spending Limits</h4>
                      <div className={styles.limitRow}>
                        <span>Daily Limit</span>
                        <span>{formatCurrency(card.dailyLimit)}</span>
                      </div>
                      <div className={styles.limitRow}>
                        <span>Monthly Limit</span>
                        <span>{formatCurrency(card.monthlyLimit)}</span>
                      </div>
                      <div className={styles.limitRow}>
                        <span>Spent This Month</span>
                        <span>{formatCurrency(card.currentMonthSpent)}</span>
                      </div>
                      <div className={styles.limitProgress}>
                        <div 
                          className={styles.limitProgressBar}
                          style={{ width: `${Math.min((card.currentMonthSpent / card.monthlyLimit) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>

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
                          🔓 Unfreeze Card
                        </button>
                      )}
                      {card.status === "pending" && (
                        <div className={styles.pendingMessage}>
                          ⏳ Awaiting admin approval
                        </div>
                      )}
                      {card.status === "processing" && (
                        <div className={styles.processingMessage}>
                          ⚙️ Card is being processed
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
                    className={`${styles.cardTypeBtn} ${styles.visaBtn} ${requestForm.cardType === "visa" ? styles.active : ""}`}
                    onClick={() => setRequestForm({ ...requestForm, cardType: "visa" })}
                  >
                    <VisaLogo />
                  </button>
                  <button
                    className={`${styles.cardTypeBtn} ${styles.mastercardBtn} ${requestForm.cardType === "mastercard" ? styles.active : ""}`}
                    onClick={() => setRequestForm({ ...requestForm, cardType: "mastercard" })}
                  >
                    <MastercardLogo />
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
                    >
                      <div className={styles.tierHeader}>
                        <span className={styles.tierName}>{tier.name}</span>
                        <span className={styles.tierFee}>
                          {tier.fee === 0 ? "Free" : `$${tier.fee}/mo`}
                        </span>
                      </div>
                      <div className={styles.tierLimits}>
                        <div>Daily: {formatCurrency(tier.dailyLimit)}</div>
                        <div>Monthly: {formatCurrency(tier.monthlyLimit)}</div>
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
                  
                  {/* Mini Card Preview */}
                  <div 
                    className={styles.miniCardPreview}
                    style={{ background: getCardBackground(selectedCard?.cardType || "visa", selectedCard?.cardTier || "standard") }}
                  >
                    <div className={styles.miniCardLogo}>
                      {selectedCard?.cardType === "visa" ? <VisaLogo /> : <MastercardLogo />}
                    </div>
                    <div className={styles.miniCardNumber}>{revealedCard.cardNumber}</div>
                  </div>

                  <div className={styles.revealField}>
                    <label>Card Number</label>
                    <div className={styles.revealValue}>
                      <span>{revealedCard.cardNumber}</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(revealedCard.cardNumber.replace(/\s/g, ""))}
                        title="Copy"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                  <div className={styles.revealRow}>
                    <div className={styles.revealField}>
                      <label>Expiry Date</label>
                      <div className={styles.revealValue}>
                        <span>{revealedCard.expiry}</span>
                      </div>
                    </div>
                    <div className={styles.revealField}>
                      <label>CVV</label>
                      <div className={styles.revealValue}>
                        <span>{revealedCard.cvv}</span>
                        <button onClick={() => navigator.clipboard.writeText(revealedCard.cvv)} title="Copy">
                          📋
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className={styles.revealField}>
                    <label>Cardholder Name</label>
                    <div className={styles.revealValue}>
                      <span>{revealedCard.cardholderName}</span>
                    </div>
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
