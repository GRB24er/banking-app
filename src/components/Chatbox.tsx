"use client";

import { useState, useEffect } from "react";
import styles from "./Chatbox.module.css";
import AppIcon from "@/components/AppIcon"; // use your icon system

export default function Chatbox() {
  const [open, setOpen] = useState(false);

  // Auto open on page load
  useEffect(() => {
    const timer = setTimeout(() => {
      setOpen(true);
    }, 1500); // show after 1.5s
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          className={styles.chatTrigger}
          onClick={() => setOpen(true)}
          aria-label="Chat support"
        >
          <AppIcon name="message" size={20} />
        </button>
      )}

      {/* Chatbox popup */}
      {open && (
        <div className={styles.chatPopup}>
          <div className={styles.chatHeader}>
            <h4>Speak with a sales expert</h4>
            <button
              className={styles.closeBtn}
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          <div className={styles.chatBody}>
            <p>All our agents are currently busy</p>
            <button className={styles.primaryBtn}>Request a callback</button>
            <hr />
            <p className={styles.supportText}>Need product support?</p>
            <button className={styles.secondaryBtn}>Visit our support hub</button>
          </div>
        </div>
      )}
    </>
  );
}
