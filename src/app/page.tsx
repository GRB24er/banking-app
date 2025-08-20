"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./landing.module.css";

export default function LandingPage() {
  const [showModal, setShowModal] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();

  useEffect(() => {
    // Show modal after 2 seconds
    const timer = setTimeout(() => setShowModal(true), 2000);

    // Handle scroll effect
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);

    // Auto-rotate hero slides
    const slideTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearInterval(slideTimer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const features = [
    {
      icon: "💳",
      title: "Premium Banking",
      description: "Access exclusive banking services with our Premier Checking account featuring no fees and unlimited transactions.",
      link: "/accounts"
    },
    {
      icon: "📈",
      title: "Investment Portfolio",
      description: "Grow your wealth with our comprehensive investment solutions. Track $45M+ portfolios with real-time analytics.",
      link: "/investments"
    },
    {
      icon: "🏦",
      title: "Loans & Mortgages",
      description: "Competitive rates on personal loans, mortgages, and business financing with quick approval process.",
      link: "/loans"
    },
    {
      icon: "🔒",
      title: "Advanced Security",
      description: "Bank with confidence using 256-bit encryption, biometric authentication, and real-time fraud monitoring.",
      link: "/security"
    }
  ];

  const stats = [
    { value: "$45.46M", label: "Assets Under Management" },
    { value: "373.53%", label: "Average Portfolio Return" },
    { value: "20+", label: "Years of Excellence" },
    { value: "24/7", label: "Customer Support" }
  ];

  const testimonials = [
    {
      name: "Hajand Morgan",
      role: "Premium Account Holder",
      content: "Horizon Global Capital has transformed my investment journey. The 373% return over 20 years speaks for itself.",
      rating: 5
    },
    {
      name: "Sarah Johnson",
      role: "Business Owner",
      content: "The business banking solutions and personalized service have been instrumental in growing my company.",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Investment Client",
      content: "Professional wealth management with cutting-edge technology. Truly a premier banking experience.",
      rating: 5
    }
  ];

  return (
    <div className={styles.landingPage}>
      {/* ===== ANNOUNCEMENT MODAL ===== */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeModal} onClick={() => setShowModal(false)}>×</button>
            
            <div className={styles.modalHeader}>
              <div className={styles.modalIcon}>🎉</div>
              <h2 className={styles.modalTitle}>Welcome to Horizon Global Capital</h2>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.announcement}>
                <h3>🌟 Special Announcement</h3>
                <p>Experience premium banking with our exclusive benefits:</p>
                <ul>
                  <li>✓ No monthly fees on Premier accounts</li>
                  <li>✓ Access to $45M+ investment portfolio management</li>
                  <li>✓ 24/7 priority customer support</li>
                  <li>✓ Exclusive wealth management services</li>
                </ul>
              </div>

              <div className={styles.branchHours}>
                <h3>📍 Branch Hours</h3>
                <div className={styles.hoursGrid}>
                  <div>
                    <strong>Weekdays</strong>
                    <p>9:00 AM - 6:00 PM</p>
                  </div>
                  <div>
                    <strong>Saturday</strong>
                    <p>9:00 AM - 2:00 PM</p>
                  </div>
                  <div>
                    <strong>Sunday</strong>
                    <p>Digital Banking 24/7</p>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button onClick={() => {
                setShowModal(false);
                router.push('/auth/signup');
              }} className={styles.modalPrimary}>
                Open Account
              </button>
              <button onClick={() => setShowModal(false)} className={styles.modalSecondary}>
                Continue Browsing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== HEADER ===== */}
      <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
        <div className={styles.headerContent}>
          <div className={styles.brand}>
            <div className={styles.logoWrapper}>
              <span className={styles.logoIcon}>🏦</span>
            </div>
            <div className={styles.brandText}>
              <span className={styles.brandName}>Horizon</span>
              <span className={styles.brandTagline}>Global Capital</span>
            </div>
          </div>

          <nav className={styles.nav}>
            <div className={styles.navItem}>
              <Link href="#personal">Personal</Link>
              <div className={styles.dropdown}>
                <Link href="/accounts/checking">Checking Accounts</Link>
                <Link href="/accounts/savings">Savings Accounts</Link>
                <Link href="/cards">Credit Cards</Link>
                <Link href="/loans">Personal Loans</Link>
              </div>
            </div>
            <div className={styles.navItem}>
              <Link href="#business">Business</Link>
              <div className={styles.dropdown}>
                <Link href="/business/accounts">Business Banking</Link>
                <Link href="/business/loans">Business Loans</Link>
                <Link href="/business/merchant">Merchant Services</Link>
              </div>
            </div>
            <div className={styles.navItem}>
              <Link href="#wealth">Wealth</Link>
              <div className={styles.dropdown}>
                <Link href="/investments/portfolio">Investment Portfolio</Link>
                <Link href="/investments/trading">Trading Platform</Link>
                <Link href="/wealth/planning">Financial Planning</Link>
              </div>
            </div>
            <Link href="#about">About</Link>
          </nav>

          <div className={styles.authButtons}>
            <Link href="/auth/signin" className={styles.loginButton}>
              <span>🔐</span> Sign In
            </Link>
            <Link href="/auth/signup" className={styles.signupButton}>
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ===== HERO SECTION ===== */}
      <section className={styles.hero}>
        <div className={styles.heroSlider}>
          <div className={`${styles.heroSlide} ${currentSlide === 0 ? styles.active : ''}`}>
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>
                Transform Your <span>Financial Future</span>
              </h1>
              <p className={styles.heroSubtitle}>
                Join thousands who've grown their wealth by 373% with our premier investment services.
                Your $9.6M could become $45.46M.
              </p>
              <div className={styles.heroActions}>
                <Link href="/auth/signup" className={styles.heroPrimary}>
                  Open Premium Account
                </Link>
                <Link href="/auth/signin" className={styles.heroSecondary}>
                  Access Your Portfolio
                </Link>
              </div>
              <div className={styles.heroStats}>
                <div className={styles.stat}>
                  <span className={styles.statValue}>$45.46M</span>
                  <span className={styles.statLabel}>Portfolio Value</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>373.53%</span>
                  <span className={styles.statLabel}>Total Returns</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>20 Years</span>
                  <span className={styles.statLabel}>Proven Growth</span>
                </div>
              </div>
            </div>
            <div className={styles.heroVisual}>
              <div className={styles.portfolioChart}>
                <div className={styles.chartGrow}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section className={styles.features}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2>Premier Banking Services</h2>
            <p>Experience banking reimagined with cutting-edge technology and personalized service</p>
          </div>
          
          <div className={styles.featuresGrid}>
            {features.map((feature, index) => (
              <div key={index} className={styles.featureCard}>
                <div className={styles.featureIcon}>{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <Link href={feature.link} className={styles.featureLink}>
                  Learn More →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== STATS SECTION ===== */}
      <section className={styles.statsSection}>
        <div className={styles.container}>
          <div className={styles.statsGrid}>
            {stats.map((stat, index) => (
              <div key={index} className={styles.statCard}>
                <div className={styles.statNumber}>{stat.value}</div>
                <div className={styles.statDescription}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ACCOUNT TYPES ===== */}
      <section className={styles.accountTypes}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2>Choose Your Account</h2>
            <p>Start your journey with the perfect account for your needs</p>
          </div>
          
          <div className={styles.accountsGrid}>
            <div className={styles.accountCard}>
              <div className={styles.accountBadge}>Most Popular</div>
              <h3>Premier Checking</h3>
              <div className={styles.accountBalance}>$4,000</div>
              <ul className={styles.accountFeatures}>
                <li>✓ No monthly fees</li>
                <li>✓ Unlimited transactions</li>
                <li>✓ Free wire transfers</li>
                <li>✓ Premium debit card</li>
              </ul>
              <button onClick={() => router.push('/auth/signup')} className={styles.accountButton}>
                Open Account
              </button>
            </div>

            <div className={styles.accountCard}>
              <div className={styles.accountBadge}>High Yield</div>
              <h3>Savings Plus</h3>
              <div className={styles.accountBalance}>4.50% APY</div>
              <ul className={styles.accountFeatures}>
                <li>✓ High interest rate</li>
                <li>✓ No minimum balance</li>
                <li>✓ Mobile check deposit</li>
                <li>✓ Auto-save features</li>
              </ul>
              <button onClick={() => router.push('/auth/signup')} className={styles.accountButton}>
                Start Saving
              </button>
            </div>

            <div className={styles.accountCard}>
              <div className={styles.accountBadge}>Exclusive</div>
              <h3>Investment Portfolio</h3>
              <div className={styles.accountBalance}>$45.46M</div>
              <ul className={styles.accountFeatures}>
                <li>✓ Professional management</li>
                <li>✓ 373% proven returns</li>
                <li>✓ Real-time analytics</li>
                <li>✓ Dedicated advisor</li>
              </ul>
              <button onClick={() => router.push('/auth/signup')} className={styles.accountButton}>
                Start Investing
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className={styles.testimonials}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2>What Our Clients Say</h2>
            <p>Join thousands of satisfied customers who trust us with their financial future</p>
          </div>
          
          <div className={styles.testimonialsGrid}>
            {testimonials.map((testimonial, index) => (
              <div key={index} className={styles.testimonialCard}>
                <div className={styles.stars}>
                  {'★'.repeat(testimonial.rating)}
                </div>
                <p>"{testimonial.content}"</p>
                <div className={styles.testimonialAuthor}>
                  <strong>{testimonial.name}</strong>
                  <span>{testimonial.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className={styles.cta}>
        <div className={styles.container}>
          <h2>Ready to Start Your Financial Journey?</h2>
          <p>Join Horizon Global Capital today and experience banking excellence</p>
          <div className={styles.ctaButtons}>
            <Link href="/auth/signup" className={styles.ctaPrimary}>
              Open Your Account
            </Link>
            <Link href="/auth/signin" className={styles.ctaSecondary}>
              Sign In to Banking
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerContent}>
            <div className={styles.footerSection}>
              <h4>About Horizon</h4>
              <p>Premier independent banking committed to your financial success with over 20 years of excellence.</p>
              <div className={styles.socialLinks}>
                <a href="#">📘</a>
                <a href="#">🐦</a>
                <a href="#">📷</a>
                <a href="#">💼</a>
              </div>
            </div>
            
            <div className={styles.footerSection}>
              <h4>Banking</h4>
              <Link href="/accounts/checking">Checking Accounts</Link>
              <Link href="/accounts/savings">Savings Accounts</Link>
              <Link href="/loans">Loans & Credit</Link>
              <Link href="/cards">Credit Cards</Link>
            </div>
            
            <div className={styles.footerSection}>
              <h4>Investing</h4>
              <Link href="/investments/portfolio">Portfolio Management</Link>
              <Link href="/investments/trading">Trading Platform</Link>
              <Link href="/investments/research">Market Research</Link>
              <Link href="/wealth">Wealth Management</Link>
            </div>
            
            <div className={styles.footerSection}>
              <h4>Support</h4>
              <Link href="/support">Help Center</Link>
              <Link href="/security">Security</Link>
              <Link href="/contact">Contact Us</Link>
              <a href="tel:1-800-HORIZON">1-800-HORIZON</a>
            </div>
          </div>
          
          <div className={styles.footerBottom}>
            <p>© 2025 Horizon Global Capital. All rights reserved. Member FDIC. Equal Housing Lender.</p>
            <div className={styles.footerLinks}>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms of Service</Link>
              <Link href="/accessibility">Accessibility</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}