"use client";

import { useState, useEffect, useRef } from "react";
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  onSnapshot, 
  query, 
  orderBy,
  DocumentData
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { db, auth } from "@/lib/firebase";
import { MessageCircle, X, Send, User, CheckCircle, Loader2 } from "lucide-react";
import styles from "./Chatbox.module.css";

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: any;
}

export default function Chatbox() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [user] = useAuthState(auth);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch real-time messages
  useEffect(() => {
    if (!open || !user) return;

    const q = query(
      collection(db, "messages"), 
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        text: doc.data().text,
        sender: doc.data().sender,
        timestamp: doc.data().timestamp
      }));
      setMessages(msgs);
      setIsLoading(false);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [open, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    if (!inputText.trim() || !user?.email) return;

    try {
      await addDoc(collection(db, "messages"), {
        text: inputText,
        sender: user.email,
        timestamp: serverTimestamp()
      });
      setInputText("");
    } catch (error) {
      console.error("Error sending message: ", error);
    }
  };

  // Auto-open with delay
  useEffect(() => {
    const timer = setTimeout(() => setOpen(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Floating trigger button */}
      {!open && (
        <button
          className={styles.chatTrigger}
          onClick={() => setOpen(true)}
          aria-label="Open chat"
        >
          <MessageCircle size={20} />
          {messages.length > 0 && (
            <span className={styles.notificationBadge}>
              {messages.length}
            </span>
          )}
        </button>
      )}

      {/* Chat popup */}
      {open && (
        <div className={styles.chatPopup}>
          <div className={styles.chatHeader}>
            <div className={styles.agentInfo}>
              <User size={16} />
              <div>
                <h4>Bank Support</h4>
                <small>
                  {isLoading ? (
                    <span className={styles.status}>
                      <Loader2 size={12} className={styles.spin} /> Connecting...
                    </span>
                  ) : (
                    <span className={styles.status}>
                      <CheckCircle size={12} /> Online
                    </span>
                  )}
                </small>
              </div>
            </div>
            <button
              className={styles.closeBtn}
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              <X size={20} />
            </button>
          </div>

          <div className={styles.chatBody}>
            {isLoading ? (
              <div className={styles.loading}>
                <Loader2 size={24} className={styles.spin} />
                <p>Connecting to secure chat...</p>
              </div>
            ) : (
              <>
                <div className={styles.messages}>
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`${styles.message} ${
                        msg.sender === user?.email 
                          ? styles.userMessage 
                          : styles.botMessage
                      }`}
                    >
                      {msg.text}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className={styles.inputArea}>
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Type your secure message..."
                    aria-label="Chat input"
                  />
                  <button
                    className={styles.sendBtn}
                    onClick={handleSend}
                    disabled={!inputText.trim()}
                    aria-label="Send message"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}