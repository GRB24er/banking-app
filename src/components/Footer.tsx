// components/Footer.tsx
"use client";

import { useState } from "react";
import styles from "./Footer.module.css";
import Link from "next/link";
import { motion } from "framer-motion";

const Footer = () => {
  const [emailSubscribe, setEmailSubscribe] = useState("");
  const [subscribeStatus, setSubscribeStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailSubscribe) {
      setSubscribeStatus("success");
      setTimeout(() => {
        setSubscribeStatus("idle");
        setEmailSubscribe("");
      }, 3000);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerTop}>
        <div className={styles.container}>
          {/* Brand Section */}
          <div className={styles.brandSection}>
            <div className={styles.brandHeader}>
              <span className={styles.brandIcon}>🏦</span>
              <div className={styles.brandInfo}>
                <h3 className={styles.brandName}>ZentriBank</h3>
                <p className={styles.brandTagline}>Your Trust, Our Commitment</p>
              </div>
            </div>
            
            <p className={styles.brandDescription}>
              Leading the future of digital banking with secure, innovative solutions 
              that empower your financial journey. Member FDIC. Equal Housing Lender.
            </p>

            {/* App Download Buttons */}
            <div className={styles.appButtons}>
              <button className={styles.appButton}>
                <span className={styles.appIcon}>📱</span>
                <div className={styles.appText}>
                  <span className={styles.appLabel}>Download on the</span>
                  <span className={styles.appStore}>App Store</span>
                </div>
              </button>
              <button className={styles.appButton}>
                <span className={styles.appIcon}>🤖</span>
                <div className={styles.appText}>
                  <span className={styles.appLabel}>Get it on</span>
                  <span className={styles.appStore}>Google Play</span>
                </div>
              </button>
            </div>

            {/* Social Links */}
            <div className={styles.socialLinks}>
              <a href="#" className={styles.socialLink} aria-label="Facebook">f</a>
              <a href="#" className={styles.socialLink} aria-label="Twitter">𝕏</a>
              <a href="#" className={styles.socialLink} aria-label="LinkedIn">in</a>
              <a href="#" className={styles.socialLink} aria-label="Instagram">📷</a>
              <a href="#" className={styles.socialLink} aria-label="YouTube">▶</a>
            </div>
          </div>

          {/* Quick Links Sections */}
          <div className={styles.linksGrid}>
            <div className={styles.linkSection}>
              <h4 className={styles.linkTitle}>Personal Banking</h4>
              <ul className={styles.linkList}>
                <li><Link href="/accounts/checking">Checking Accounts</Link></li>
                <li><Link href="/accounts/savings">Savings Accounts</Link></li>
                <li><Link href="/cards/credit">Credit Cards</Link></li>
                <li><Link href="/loans/personal">Personal Loans</Link></li>
                <li><Link href="/loans/mortgage">Mortgages</Link></li>
                <li><Link href="/loans/auto">Auto Loans</Link></li>
              </ul>
            </div>

            <div className={styles.linkSection}>
              <h4 className={styles.linkTitle}>Business Banking</h4>
              <ul className={styles.linkList}>
                <li><Link href="/business/accounts">Business Accounts</Link></li>
                <li><Link href="/business/loans">Business Loans</Link></li>
                <li><Link href="/business/merchant">Merchant Services</Link></li>
                <li><Link href="/business/payroll">Payroll Solutions</Link></li>
                <li><Link href="/business/treasury">Treasury Management</Link></li>
              </ul>
            </div>

            <div className={styles.linkSection}>
              <h4 className={styles.linkTitle}>Wealth Management</h4>
              <ul className={styles.linkList}>
                <li><Link href="/wealth/investment">Investment Services</Link></li>
                <li><Link href="/wealth/retirement">Retirement Planning</Link></li>
                <li><Link href="/wealth/trust">Trust Services</Link></li>
                <li><Link href="/wealth/private">Private Banking</Link></li>
                <li><Link href="/wealth/advisory">Financial Advisory</Link></li>
              </ul>
            </div>

            <div className={styles.linkSection}>
              <h4 className={styles.linkTitle}>Resources</h4>
              <ul className={styles.linkList}>
                <li><Link href="/help">Help Center</Link></li>
                <li><Link href="/security">Security Center</Link></li>
                <li><Link href="/rates">Rates & Fees</Link></li>
                <li><Link href="/locations">Find ATM/Branch</Link></li>
                <li><Link href="/contact">Contact Us</Link></li>
                <li><Link href="/careers">Careers</Link></li>
              </ul>
            </div>
          </div>

          {/* Contact & Newsletter Section */}
          <div className={styles.contactSection}>
            <h4 className={styles.contactTitle}>Stay Connected</h4>
            
            {/* Newsletter Signup */}
            <form className={styles.newsletter} onSubmit={handleSubscribe}>
              <input
                type="email"
                placeholder="Enter your email for updates"
                value={emailSubscribe}
                onChange={(e) => setEmailSubscribe(e.target.value)}
                className={styles.newsletterInput}
              />
              <button type="submit" className={styles.newsletterButton}>
                Subscribe
              </button>
            </form>
            {subscribeStatus === "success" && (
              <p className={styles.successMessage}>✓ Successfully subscribed!</p>
            )}

            {/* Contact Info */}
            <div className={styles.contactInfo}>
              <div className={styles.contactItem}>
                <span className={styles.contactIcon}>📞</span>
                <div>
                  <p className={styles.contactLabel}>24/7 Support</p>
                  <a href="tel:1-800-ZentriBank" className={styles.contactValue}>
                    1-800-ZentriBank
                  </a>
                </div>
              </div>
              
              <div className={styles.contactItem}>
                <span className={styles.contactIcon}>💬</span>
                <div>
                  <p className={styles.contactLabel}>Live Chat</p>
                  <button className={styles.chatButton}>Start Chat</button>
                </div>
              </div>
              
              <div className={styles.contactItem}>
                <span className={styles.contactIcon}>📍</span>
                <div>
                  <p className={styles.contactLabel}>Headquarters</p>
                  <p className={styles.contactValue}>
                    Dock House
                    79 High Street<br />
                    Brentford, TW8 8AE
                    United Kingdom
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className={styles.trustBadges}>
        <div className={styles.container}>
          <div className={styles.badgesGrid}>
            <div className={styles.badge}>
              <span className={styles.badgeIcon}>🛡️</span>
              <span className={styles.badgeText}>FDIC Insured</span>
           </div>
           <div className={styles.badge}>
             <span className={styles.badgeIcon}>🔒</span>
             <span className={styles.badgeText}>256-bit SSL</span>
           </div>
           <div className={styles.badge}>
             <span className={styles.badgeIcon}>🏠</span>
             <span className={styles.badgeText}>Equal Housing Lender</span>
           </div>
           <div className={styles.badge}>
             <span className={styles.badgeIcon}>⭐</span>
             <span className={styles.badgeText}>4.9/5 Rating</span>
           </div>
           <div className={styles.badge}>
             <span className={styles.badgeIcon}>🏆</span>
             <span className={styles.badgeText}>Best Bank 2024</span>
           </div>
         </div>
       </div>
     </div>

     {/* Bottom Bar */}
     <div className={styles.footerBottom}>
       <div className={styles.container}>
         <div className={styles.bottomContent}>
           <div className={styles.copyright}>
             <p>© {currentYear} ZentriBank. All rights reserved.</p>
             <p className={styles.legalText}>
               ZentriBank, N.A. Member FDIC. 
               <span className={styles.separator}>|</span>
               NMLS #123456
             </p>
           </div>
           
           <div className={styles.legalLinks}>
             <Link href="/privacy">Privacy Policy</Link>
             <span className={styles.separator}>|</span>
             <Link href="/terms">Terms of Service</Link>
             <span className={styles.separator}>|</span>
             <Link href="/accessibility">Accessibility</Link>
             <span className={styles.separator}>|</span>
             <Link href="/disclosures">Disclosures</Link>
             <span className={styles.separator}>|</span>
             <Link href="/sitemap">Sitemap</Link>
           </div>

           <div className={styles.languageSelector}>
             <select className={styles.languageDropdown}>
               <option value="en">🇺🇸 English</option>
               <option value="es">🇪🇸 Español</option>
               <option value="zh">🇨🇳 中文</option>
               <option value="fr">🇫🇷 Français</option>
             </select>
           </div>
         </div>
       </div>
     </div>

     {/* Floating Help Button */}
     <motion.button
       className={styles.floatingHelp}
       whileHover={{ scale: 1.05 }}
       whileTap={{ scale: 0.95 }}
       aria-label="Help"
     >
       <span>?</span>
       <span className={styles.helpText}>Need Help?</span>
     </motion.button>
   </footer>
 );
};

export default Footer;