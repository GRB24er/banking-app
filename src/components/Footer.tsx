"use client";

import styles from "./Footer.module.css";
import Link from "next/link";
import BankLogo from "@/components/BankLogo";
import Chatbox from "@/components/Chatbox";

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        {/* Brand Section */}
        <div className={styles.brandSection}>
          <div className={styles.logoRow}>
            <BankLogo width={32} height={32} className={styles.logoImage} />
            <span className={styles.brandName}>
              Horizon Global Capital
            </span>
          </div>
          <p className={styles.tagline}>
            Banking that empowers your financial future with secure, modern
            solutions.
          </p>
        </div>

        {/* Contact Info */}
        <div className={styles.contactSection}>
          <h4 className={styles.sectionTitle}>Contact Us</h4>
          <ul className={styles.contactList}>
            <li>1234 Finance Street, Suite 500</li>
            <li>New York, NY 10001</li>
            <li>
              Support:{" "}
              <a href="tel:+15551234567" className={styles.link}>
                +1 (555) 123-4567
              </a>
            </li>
            <li>
              Email:{" "}
              <a
                href="mailto:support@horizonbank.com"
                className={styles.link}
              >
                support@horizonbank.com
              </a>
            </li>
          </ul>
        </div>

        {/* Quick Links */}
        <div className={styles.linksSection}>
          <h4 className={styles.sectionTitle}>Quick Links</h4>
          <ul className={styles.linkList}>
            <li>
              <Link href="/dashboard" className={styles.link}>
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/transfers" className={styles.link}>
                Transfers
              </Link>
            </li>
            <li>
              <Link href="/settings" className={styles.link}>
                Settings
              </Link>
            </li>
            <li>
              <Link href="/reports" className={styles.link}>
                Reports
              </Link>
            </li>
          </ul>
        </div>

        {/* Legal Notice */}
        <div className={styles.legalSection}>
          <p className={styles.copy}>
            © {new Date().getFullYear()} Horizon Global Capital. FDIC Insured.
            256-bit SSL Encryption.
          </p>
        </div>
      </div>

      {/* Chatbox */}
      <Chatbox />
    </footer>
  );
};

export default Footer;
