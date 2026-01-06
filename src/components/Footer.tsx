"use client";

import { useState } from "react";
import styles from "./Footer.module.css";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield,
  Lock,
  Home,
  Star,
  Award,
  Phone,
  MessageSquare,
  MapPin,
  Mail,
  Globe,
} from "lucide-react";

const Footer = () => {
  const [emailSubscribe, setEmailSubscribe] = useState("");
  const [subscribeStatus, setSubscribeStatus] =
    useState<"idle" | "success" | "error" | "loading">("idle");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailSubscribe) return;

    try {
      setSubscribeStatus("loading");
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailSubscribe,
          source: "footer",
        }),
      });

      if (!res.ok) {
        throw new Error("Subscription failed");
      }

      setSubscribeStatus("success");
      setEmailSubscribe("");
      setTimeout(() => setSubscribeStatus("idle"), 4000);
    } catch (err) {
      setSubscribeStatus("error");
      setTimeout(() => setSubscribeStatus("idle"), 4000);
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
              <div className={styles.brandLogo}>
                <div className={styles.logoIcon}>H</div>
                <div className={styles.logoPulse}></div>
              </div>
              <div className={styles.brandInfo}>
                <h3 className={styles.brandName}>Horizon Global Capital</h3>
                <p className={styles.brandTagline}>
                  Secure • Innovative • Trusted
                </p>
              </div>
            </div>

            <p className={styles.brandDescription}>
              A premier digital banking institution delivering financial
              services with modern technology, robust security, and dedicated
              client support across global markets.
            </p>

            {/* App Download Buttons (Official-style badges) */}
            <div className={styles.appButtons}>
              <a
                href="https://apps.apple.com/app/id0000000000"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Download on the App Store"
              >
                <img
                  src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us?size=250x83"
                  alt="Download on the App Store"
                  className={styles.storeBadge}
                />
              </a>

              <a
                href="https://play.google.com/store/apps/details?id=com.example.app"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Get it on Google Play"
              >
                <img
                  src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
                  alt="Get it on Google Play"
                  className={styles.storeBadge}
                />
              </a>
            </div>

            {/* Social Links */}
            <div className={styles.socialLinks}>
              <motion.a
                href="https://www.facebook.com/yourbrand"
                className={styles.socialLink}
                whileHover={{ y: -3, backgroundColor: "rgba(16, 185, 129, 0.15)" }}
                aria-label="Facebook"
              >
                <svg
                  className={styles.socialIcon}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </motion.a>

              <motion.a
                href="https://x.com/yourbrand"
                className={styles.socialLink}
                whileHover={{ y: -3, backgroundColor: "rgba(16, 185, 129, 0.15)" }}
                aria-label="X (Twitter)"
              >
                <svg
                  className={styles.socialIcon}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.213c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </motion.a>

              <motion.a
                href="https://www.linkedin.com/company/yourbrand"
                className={styles.socialLink}
                whileHover={{ y: -3, backgroundColor: "rgba(16, 185, 129, 0.15)" }}
                aria-label="LinkedIn"
              >
                <svg
                  className={styles.socialIcon}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </motion.a>

              <motion.a
                href="https://www.instagram.com/yourbrand"
                className={styles.socialLink}
                whileHover={{ y: -3, backgroundColor: "rgba(16, 185, 129, 0.15)" }}
                aria-label="Instagram"
              >
                <svg
                  className={styles.socialIcon}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </motion.a>

              <motion.a
                href="https://www.youtube.com/@yourbrand"
                className={styles.socialLink}
                whileHover={{ y: -3, backgroundColor: "rgba(16, 185, 129, 0.15)" }}
                aria-label="YouTube"
              >
                <svg
                  className={styles.socialIcon}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </motion.a>
            </div>
          </div>

          {/* Quick Links Sections */}
          <div className={styles.linksGrid}>
            <div className={styles.linkSection}>
              <h4 className={styles.linkTitle}>Personal Banking</h4>
              <ul className={styles.linkList}>
                {[
                  "Checking Accounts",
                  "Savings Accounts",
                  "Credit Cards",
                  "Personal Loans",
                  "Mortgages",
                  "Auto Loans",
                ].map((item, idx) => (
                  <motion.li key={idx} whileHover={{ x: 5 }}>
                    <Link
                      href={`/${item.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <span className={styles.linkBullet}>•</span>
                      {item}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </div>

            <div className={styles.linkSection}>
              <h4 className={styles.linkTitle}>Business Solutions</h4>
              <ul className={styles.linkList}>
                {[
                  "Business Accounts",
                  "Commercial Loans",
                  "Merchant Services",
                  "Payroll Solutions",
                  "Treasury Management",
                  "Business Credit",
                ].map((item, idx) => (
                  <motion.li key={idx} whileHover={{ x: 5 }}>
                    <Link
                      href={`/business/${item
                        .toLowerCase()
                        .replace(/\s+/g, "-")}`}
                    >
                      <span className={styles.linkBullet}>•</span>
                      {item}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </div>

            <div className={styles.linkSection}>
              <h4 className={styles.linkTitle}>Wealth Management</h4>
              <ul className={styles.linkList}>
                {[
                  "Investment Services",
                  "Retirement Planning",
                  "Trust Services",
                  "Private Banking",
                  "Estate Planning",
                  "Tax Advisory",
                ].map((item, idx) => (
                  <motion.li key={idx} whileHover={{ x: 5 }}>
                    <Link
                      href={`/wealth/${item
                        .toLowerCase()
                        .replace(/\s+/g, "-")}`}
                    >
                      <span className={styles.linkBullet}>•</span>
                      {item}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </div>

            <div className={styles.linkSection}>
              <h4 className={styles.linkTitle}>Resources</h4>
              <ul className={styles.linkList}>
                {[
                  "Help Center",
                  "Security Center",
                  "Rates & Fees",
                  "Find Locations",
                  "Contact Us",
                  "Careers",
                ].map((item, idx) => (
                  <motion.li key={idx} whileHover={{ x: 5 }}>
                    <Link
                      href={`/${item.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <span className={styles.linkBullet}>•</span>
                      {item}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact & Newsletter Section */}
          <div className={styles.contactSection}>
            <h4 className={styles.contactTitle}>Stay Connected</h4>

            {/* Newsletter Signup */}
            <form className={styles.newsletter} onSubmit={handleSubscribe}>
              <div className={styles.newsletterGroup}>
                <Mail className={styles.newsletterIcon} />
                <input
                  type="email"
                  placeholder="Enter your email for financial insights"
                  value={emailSubscribe}
                  onChange={(e) => setEmailSubscribe(e.target.value)}
                  className={styles.newsletterInput}
                  required
                />
                <motion.button
                  type="submit"
                  className={styles.newsletterButton}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={subscribeStatus === "loading"}
                >
                  {subscribeStatus === "loading" ? "Subscribing..." : "Subscribe"}
                </motion.button>
              </div>
              <p className={styles.consentText}>
                By subscribing, you agree to receive communications in accordance
                with our{" "}
                <Link href="/privacy-policy" className={styles.inlineLink}>
                  Privacy Policy
                </Link>
                .
              </p>
            </form>

            {subscribeStatus === "success" && (
              <motion.p
                className={styles.successMessage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                ✓ You’re subscribed to financial updates.
              </motion.p>
            )}

            {subscribeStatus === "error" && (
              <motion.p
                className={styles.errorMessage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                We couldn’t process your request. Please try again.
              </motion.p>
            )}

            {/* Contact Info */}
            <div className={styles.contactInfo}>
              <motion.div
                className={styles.contactItem}
                whileHover={{ backgroundColor: "rgba(16, 185, 129, 0.08)" }}
              >
                <div className={styles.contactIconWrapper}>
                  <Phone className={styles.contactIcon} />
                </div>
                <div>
                  <p className={styles.contactLabel}>24/7 Support</p>
                  <a href="tel:+18004674966" className={styles.contactValue}>
                    1-800-HORIZON
                  </a>
                </div>
              </motion.div>

              <motion.div
                className={styles.contactItem}
                whileHover={{ backgroundColor: "rgba(16, 185, 129, 0.08)" }}
              >
                <div className={styles.contactIconWrapper}>
                  <MessageSquare className={styles.contactIcon} />
                </div>
                <div>
                  <p className={styles.contactLabel}>Live Chat</p>
                  <button className={styles.chatButton}>Start Chat</button>
                </div>
              </motion.div>

              <motion.div
                className={styles.contactItem}
                whileHover={{ backgroundColor: "rgba(16, 185, 129, 0.08)" }}
              >
                <div className={styles.contactIconWrapper}>
                  <MapPin className={styles.contactIcon} />
                </div>
                <div>
                  <p className={styles.contactLabel}>Headquarters</p>
                  <p className={styles.contactValue}>
                    79 High Street • Brentford
                    <br />
                    TW8 8AE • United Kingdom
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className={styles.trustSection}>
        <div className={styles.container}>
          <div className={styles.badgesGrid}>
            {[
              {
                icon: <Shield />,
                text: "Member FDIC",
                desc: "Deposits insured up to applicable limits",
              },
              {
                icon: <Lock />,
                text: "TLS 1.2+ Encryption",
                desc: "256-bit encryption & HSTS",
              },
              {
                icon: <Home />,
                text: "Equal Housing Lender",
                desc: "We are an Equal Opportunity Lender",
              },
              {
                icon: <Award />,
                text: "SOC 2 Type II",
                desc: "Independently audited controls",
              },
              {
                icon: <Star />,
                text: "System Status",
                desc: "99.9%+ uptime (last 12 months)",
              },
            ].map((badge, idx) => (
              <motion.div
                key={idx}
                className={styles.badge}
                whileHover={{ y: -5 }}
              >
                <div className={styles.badgeIconWrapper}>{badge.icon}</div>
                <div className={styles.badgeContent}>
                  <span className={styles.badgeText}>{badge.text}</span>
                  <span className={styles.badgeDesc}>{badge.desc}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className={styles.footerBottom}>
        <div className={styles.container}>
          <div className={styles.bottomContent}>
            <div className={styles.copyright}>
              <p className={styles.copyrightText}>
                © {currentYear} Horizon Global Capital Bank plc. All rights
                reserved.
              </p>
              <p className={styles.legalText}>
                Horizon Global Capital Bank plc is authorized by the Prudential
                Regulation Authority and regulated by the Financial Conduct
                Authority and the Prudential Regulation Authority. Member FDIC
                and Equal Housing Lender where applicable.
              </p>
            </div>

            <div className={styles.legalLinks}>
              {[
                "Privacy Policy",
                "Terms of Use",
                "Security Center",
                "Regulatory Disclosures",
                "Cookie Preferences",
                "Sitemap",
              ].map((link, idx) => (
                <motion.div key={idx} whileHover={{ scale: 1.05 }}>
                  <Link
                    href={`/${link.toLowerCase().replace(/\s+/g, "-")}`}
                    className={styles.legalLink}
                  >
                    {link}
                  </Link>
                  {idx < 5 && <span className={styles.separator}>•</span>}
                </motion.div>
              ))}
            </div>

            <div className={styles.languageSelector}>
              <Globe className={styles.globeIcon} />
              <select className={styles.languageDropdown}>
                <option value="en">English (US)</option>
                <option value="en-gb">English (UK)</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Help Button */}
      <motion.button
        className={styles.floatingHelp}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Get Help"
      >
        <div className={styles.helpIcon}>
          <span>?</span>
        </div>
        <div className={styles.helpContent}>
          <span className={styles.helpTitle}>Need Help?</span>
          <span className={styles.helpSubtitle}>Chat with us</span>
        </div>
      </motion.button>
    </footer>
  );
};

export default Footer;
