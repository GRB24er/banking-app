"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import styles from "./adminCards.module.css";

interface CardRequest {
  _id: string;
  cardReference: string;
  userEmail: string;
  userName: string;
  cardType: string;
  cardTier: string;
  status: string;
  purpose?: string;
  requestedAt: string;
  spendingLimit: number;
  dailyLimit: number;
}

export default function AdminCardsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<CardRequest[]>([]);
  const [filter, setFilter] = useState("pending");
  const [selectedCard, setSelectedCard] = useState<CardRequest | null>(null);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [activateForm, setActivateForm] = useState({
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
  });

  useEffect(() => {
    if (status === "authenticated") {
      fetchCards();
    }
  }, [status, filter]);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/cards?status=${filter}`);
      const data = await res.json();
      if (data.success) {
        setCards(data.cards || []);
      }
    } catch (err) {
      console.error("Error fetching cards:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (cardId: string) => {
    setProcessing(true);
    try {
      const res = await fetch("/api/admin/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "process", cardId }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Card marked as processing" });
        fetchCards();
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setProcessing(false);
    }
  };

  const handleActivate = async () => {
    if (!selectedCard) return;
    
    if (!activateForm.cardNumber || !activateForm.expiryMonth || !activateForm.expiryYear || !activateForm.cvv) {
      setMessage({ type: "error", text: "All card details are required" });
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch("/api/admin/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "activate",
          cardId: selectedCard._id,
          ...activateForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Card activated! User has been notified." });
        setShowActivateModal(false);
        setSelectedCard(null);
        setActivateForm({ cardNumber: "", expiryMonth: "", expiryYear: "", cvv: "" });
        fetchCards();
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (cardId: string) => {
    const reason = prompt("Please provide rejection reason:");
    if (!reason) return;

    setProcessing(true);
    try {
      const res = await fetch("/api/admin/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", cardId, rejectionReason: reason }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Card request rejected" });
        fetchCards();
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "#10b981";
      case "pending": return "#f59e0b";
      case "processing": return "#3b82f6";
      case "rejected": return "#ef4444";
      default: return "#6b7280";
    }
  };

  return (
    <div className={styles.wrapper}>
      <AdminSidebar />
      <div className={styles.main}>
        <div className={styles.header}>
          <h1>Virtual Card Requests</h1>
          <p>Manage and approve virtual card applications</p>
        </div>

        {message.text && (
          <div className={`${styles.message} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}

        <div className={styles.filters}>
          {["pending", "processing", "active", "rejected", "all"].map((f) => (
            <button
              key={f}
              className={filter === f ? styles.active : ""}
              onClick={() => setFilter(f === "all" ? "" : f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className={styles.loading}>Loading cards...</div>
        ) : cards.length === 0 ? (
          <div className={styles.empty}>No card requests found</div>
        ) : (
          <div className={styles.cardsTable}>
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>User</th>
                  <th>Type</th>
                  <th>Tier</th>
                  <th>Limits</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cards.map((card) => (
                  <tr key={card._id}>
                    <td className={styles.reference}>{card.cardReference}</td>
                    <td>
                      <div>{card.userName}</div>
                      <small>{card.userEmail}</small>
                    </td>
                    <td>{card.cardType.toUpperCase()}</td>
                    <td>{card.cardTier}</td>
                    <td>
                      <small>Daily: ${card.dailyLimit.toLocaleString()}</small><br/>
                      <small>Spending: ${card.spendingLimit.toLocaleString()}</small>
                    </td>
                    <td>
                      <span
                        className={styles.status}
                        style={{ background: getStatusColor(card.status) }}
                      >
                        {card.status}
                      </span>
                    </td>
                    <td>{new Date(card.requestedAt).toLocaleDateString()}</td>
                    <td>
                      <div className={styles.actions}>
                        {card.status === "pending" && (
                          <>
                            <button
                              className={styles.processBtn}
                              onClick={() => handleProcess(card._id)}
                              disabled={processing}
                            >
                              Process
                            </button>
                            <button
                              className={styles.rejectBtn}
                              onClick={() => handleReject(card._id)}
                              disabled={processing}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {(card.status === "pending" || card.status === "processing") && (
                          <button
                            className={styles.activateBtn}
                            onClick={() => {
                              setSelectedCard(card);
                              setShowActivateModal(true);
                            }}
                            disabled={processing}
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Activate Modal */}
        {showActivateModal && selectedCard && (
          <div className={styles.modalOverlay} onClick={() => setShowActivateModal(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>Activate Card</h2>
                <button onClick={() => setShowActivateModal(false)}>&times;</button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.cardInfo}>
                  <p><strong>User:</strong> {selectedCard.userName}</p>
                  <p><strong>Email:</strong> {selectedCard.userEmail}</p>
                  <p><strong>Tier:</strong> {selectedCard.cardTier}</p>
                </div>

                <div className={styles.formGroup}>
                  <label>Card Number</label>
                  <input
                    type="text"
                    placeholder="4532 1234 5678 9012"
                    maxLength={19}
                    value={activateForm.cardNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").replace(/(\d{4})/g, "$1 ").trim();
                      setActivateForm({ ...activateForm, cardNumber: val });
                    }}
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Expiry Month</label>
                    <select
                      value={activateForm.expiryMonth}
                      onChange={(e) => setActivateForm({ ...activateForm, expiryMonth: e.target.value })}
                    >
                      <option value="">MM</option>
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i} value={String(i + 1).padStart(2, "0")}>
                          {String(i + 1).padStart(2, "0")}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Expiry Year</label>
                    <select
                      value={activateForm.expiryYear}
                      onChange={(e) => setActivateForm({ ...activateForm, expiryYear: e.target.value })}
                    >
                      <option value="">YY</option>
                      {Array.from({ length: 10 }, (_, i) => (
                        <option key={i} value={String(25 + i)}>
                          {25 + i}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>CVV</label>
                    <input
                      type="text"
                      placeholder="123"
                      maxLength={4}
                      value={activateForm.cvv}
                      onChange={(e) => setActivateForm({ ...activateForm, cvv: e.target.value.replace(/\D/g, "") })}
                    />
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button className={styles.cancelBtn} onClick={() => setShowActivateModal(false)}>
                  Cancel
                </button>
                <button
                  className={styles.submitBtn}
                  onClick={handleActivate}
                  disabled={processing}
                >
                  {processing ? "Activating..." : "Activate & Notify User"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
