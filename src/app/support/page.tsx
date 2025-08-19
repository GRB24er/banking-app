"use client";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import styles from "./support.module.css";

export default function SupportPage() {
  const [showChat, setShowChat] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hello! How can I help you today?" }
  ]);

  const sendMessage = () => {
    if (message.trim()) {
      setMessages([...messages, { sender: "user", text: message }]);
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          sender: "bot", 
          text: "Thank you for your message. An agent will respond shortly." 
        }]);
      }, 1000);
      setMessage("");
    }
  };

  return (
    <div className={styles.wrapper}>
      <Sidebar />
      <div className={styles.main}>
        <Header />
        
        <div className={styles.content}>
          <h1>Help & Support</h1>
          
          <div className={styles.supportGrid}>
            <div className={styles.supportCard}>
              <div className={styles.cardIcon}>💬</div>
              <h3>Live Chat</h3>
              <p>Chat with our support team</p>
              <button onClick={() => setShowChat(true)}>Start Chat</button>
            </div>
            
            <div className={styles.supportCard}>
              <div className={styles.cardIcon}>📞</div>
              <h3>Phone Support</h3>
              <p>Call us 24/7</p>
              <button>1-800-HORIZON</button>
            </div>
            
            <div className={styles.supportCard}>
              <div className={styles.cardIcon}>📧</div>
              <h3>Email Support</h3>
              <p>Get help via email</p>
              <button>Send Email</button>
            </div>
          </div>

          {/* FAQ Section */}
          <div className={styles.faqSection}>
            <h2>Frequently Asked Questions</h2>
            <div className={styles.faqItem}>
              <h4>How do I reset my password?</h4>
              <p>You can reset your password from the login page or settings.</p>
            </div>
            <div className={styles.faqItem}>
              <h4>How long do transfers take?</h4>
              <p>Domestic transfers typically complete within 1-2 business days.</p>
            </div>
          </div>
        </div>

        {/* Chat Widget */}
        {showChat && (
          <div className={styles.chatWidget}>
            <div className={styles.chatHeader}>
              <span>Live Support</span>
              <button onClick={() => setShowChat(false)}>×</button>
            </div>
            <div className={styles.chatMessages}>
              {messages.map((msg, idx) => (
                <div key={idx} className={`${styles.message} ${styles[msg.sender]}`}>
                  {msg.text}
                </div>
              ))}
            </div>
            <div className={styles.chatInput}>
              <input 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}