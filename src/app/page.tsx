"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./landing.module.css";

export default function LandingPage() {
  const [showModal, setShowModal] = useState(true);

  return (
    <div>
      {/* ===== POPUP MODAL ===== */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>New Hours Reminder</h2>
            <p>
              Beginning <strong>Saturday, August 2nd</strong>, our branches will
              have updated hours. You can still count on the same trusted service
              you know and rely on.
            </p>

            <h3>Drive-thru Hours</h3>
            <p>Mon – Fri: 9:00 am – 5:00 pm</p>
            <p>Sat: 9:00 am – 12:00 pm</p>

            <h3>Lobby Hours</h3>
            <p>Mon – Fri: 9:00 am – 4:00 pm</p>
            <p>Sat: Closed</p>

            <button
              onClick={() => setShowModal(false)}
              className={styles.modalButton}
            >
              Got It, Thanks!
            </button>
          </div>
        </div>
      )}

      {/* ===== HEADER ===== */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          {/* Logo + Name */}
          <div className={styles.brand}>
            <Image
              src="/icons/logo.svg"
              alt="Bank Logo"
              width={32}
              height={32}
              className={styles.logo}
            />
            <span className={styles.brandName}>Horizon Global Capital</span>
          </div>

          {/* Navigation */}
          <nav className={styles.nav}>
            <Link href="#">Business</Link>
            <Link href="#">Personal</Link>
            <Link href="#">Resources</Link>
            <Link href="#">About Us</Link>
          </nav>

          {/* Auth Buttons */}
          <div className={styles.authButtons}>
            <Link href="/auth/signin" className={styles.loginButton}>
              Login
            </Link>
            <Link href="/auth/signup" className={styles.signupButton}>
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* ===== HERO SECTION ===== */}
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <h1>Your Partner for the Path Ahead.</h1>
          <p>
            At Horizon Global Capital, we believe in building relationships.
            Our personalized approach to banking means we work closely with you
            to understand your unique needs and help you achieve your goals.
          </p>
          <button className={styles.learnMoreButton}>Learn More</button>
        </div>
        <div className={styles.heroImage}></div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className={styles.footer}>
        <p>
          Horizon Global Capital is a premier independent community bank committed
          to providing quality products and exceptional service.
        </p>
      </footer>
    </div>
  );
}
