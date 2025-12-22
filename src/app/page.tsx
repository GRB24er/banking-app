"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./landing.module.css";

export default function LandingPage() {
  const [showModal, setShowModal] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeNav, setActiveNav] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => setShowModal(true), 2000);
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const accountTypes = [
    {
      title: "Personal Banking",
      icon: "👤",
      items: ["Checking Accounts", "Savings Accounts", "Credit Cards", "Personal Loans"]
    },
    {
      title: "Business Banking", 
      icon: "💼",
      items: ["Business Checking", "Business Savings", "Business Loans", "Merchant Services"]
    },
    {
      title: "Wealth Management",
      icon: "📈", 
      items: ["Investment Advisory", "Retirement Planning", "Trust Services", "Private Banking"]
    }
  ];

  const products = [
    {
      icon: "💳",
      title: "Checking Accounts",
      description: "Simple, secure checking with mobile banking and fraud protection"
    },
    {
      icon: "💰",
      title: "Savings Accounts",
      description: "Competitive rates with flexible access to your money"
    },
    {
      icon: "🏠",
      title: "Home Loans",
      description: "Mortgages and home equity solutions for every stage of life"
    },
    {
      icon: "🎓",
      title: "Student Banking",
      description: "Financial tools designed specifically for students"
    }
  ];

  const features = [
    {
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop",
      title: "Simplified Checking and Payments",
      description: "Seamlessly switch banks, manage direct deposit, and streamline your payment methods. Open a checking account today.",
      cta: "Get Started",
      link: "/auth/signup"
    },
    {
      image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&h=400&fit=crop",
      title: "Advanced Security Protection",
      description: "Two-factor authentication, biometric login, and 24/7 fraud monitoring keep your accounts secure.",
      cta: "Learn More",
      link: "#security"
    },
    {
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop",
      title: "Smart Financial Insights",
      description: "AI-powered analytics and personalized recommendations help you achieve your financial goals.",
      cta: "Explore Tools",
      link: "#features"
    }
  ];

  const services = [
    {
      icon: "📱",
      title: "Mobile & Online Banking",
      description: "Bank from anywhere with our secure mobile app and online platform",
      link: "/banking/online"
    },
    {
      icon: "☎️",
      title: "Contact Us",
      description: "Connect with our customer service team by phone, chat, or in person",
      link: "/contact"
    },
    {
      icon: "📍",
      title: "Find a Branch/ATM",
      description: "Locate our branches and fee-free ATMs near you",
      link: "/locations"
    },
    {
      icon: "🤝",
      title: "Meet with a Banker",
      description: "Schedule an appointment with a financial advisor",
      link: "/appointments"
    }
  ];

  return (
    <div className={styles.landingPage}>
      {/* Welcome Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeModal} onClick={() => setShowModal(false)}>×</button>
            
            <div className={styles.modalHeader}>
              <div className={styles.modalIcon}>🎉</div>
              <h2 className={styles.modalTitle}>Welcome to ZentriBank</h2>
              <p className={styles.modalSubtitle}>Banking Made Simple</p>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.welcomeMessage}>
                <h3>Experience Premium Banking</h3>
                <ul className={styles.benefitsList}>
                  <li>✓ No monthly maintenance fees</li>
                  <li>✓ Advanced security with 2FA</li>
                  <li>✓ Real-time transaction alerts</li>
                  <li>✓ 24/7 customer support</li>
                  <li>✓ Mobile check deposit</li>
                  <li>✓ Fee-free ATM access</li>
                </ul>
              </div>

              <div className={styles.modalInfo}>
                <div className={styles.infoItem}>
                  <strong>Online Banking</strong>
                  <p>Available 24/7</p>
                </div>
                <div className={styles.infoItem}>
                  <strong>Customer Support</strong>
                  <p>Mon-Fri: 8AM-8PM EST</p>
                </div>
                <div className={styles.infoItem}>
                  <strong>Mobile App</strong>
                  <p>iOS & Android</p>
                </div>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button onClick={() => {
                setShowModal(false);
                router.push('/auth/signup');
              }} className={styles.btnModalPrimary}>
                Open Account Now
              </button>
              <button onClick={() => setShowModal(false)} className={styles.btnModalSecondary}>
                Continue Browsing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
        {/* Top Bar */}
        <div className={styles.topBar}>
          <div className={styles.container}>
            <div className={styles.topBarContent}>
              <nav className={styles.utilityNav}>
                <Link href="/es">Español</Link>
                <Link href="/locations">Find a Branch/ATM</Link>
                <Link href="/contact">Customer Service</Link>
              </nav>
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className={styles.mainHeader}>
          <div className={styles.container}>
            <div className={styles.headerContent}>
              <Link href="/" className={styles.logo}>
                <Image
                  src="/images/Logo.png"
                  alt="ZentriBank Logo"
                  width={240}
                  height={65}
                  className={styles.logoImage}
                  priority
                />
              </Link>

              <nav className={styles.primaryNav}>
                <div 
                  className={styles.navItem}
                  onMouseEnter={() => setActiveNav('personal')}
                  onMouseLeave={() => setActiveNav(null)}
                >
                  <button className={styles.navLink}>Personal</button>
                  {activeNav === 'personal' && (
                    <div className={styles.dropdown}>
                      <Link href="/checking">Checking Accounts</Link>
                      <Link href="/savings">Savings Accounts</Link>
                      <Link href="/credit-cards">Credit Cards</Link>
                      <Link href="/loans">Personal Loans</Link>
                      <Link href="/mortgages">Home Loans</Link>
                    </div>
                  )}
                </div>

                <div 
                  className={styles.navItem}
                  onMouseEnter={() => setActiveNav('business')}
                  onMouseLeave={() => setActiveNav(null)}
                >
                  <button className={styles.navLink}>Business</button>
                  {activeNav === 'business' && (
                    <div className={styles.dropdown}>
                      <Link href="/business/checking">Business Checking</Link>
                      <Link href="/business/savings">Business Savings</Link>
                      <Link href="/business/loans">Business Loans</Link>
                      <Link href="/business/credit-cards">Business Cards</Link>
                    </div>
                  )}
                </div>

                <div 
                  className={styles.navItem}
                  onMouseEnter={() => setActiveNav('wealth')}
                  onMouseLeave={() => setActiveNav(null)}
                >
                  <button className={styles.navLink}>Wealth</button>
                  {activeNav === 'wealth' && (
                    <div className={styles.dropdown}>
                      <Link href="/wealth/advisory">Investment Advisory</Link>
                      <Link href="/wealth/retirement">Retirement Planning</Link>
                      <Link href="/wealth/trust">Trust Services</Link>
                      <Link href="/wealth/private">Private Banking</Link>
                    </div>
                  )}
                </div>

                <Link href="/about" className={styles.navLink}>About</Link>
              </nav>

              <div className={styles.headerActions}>
                <Link href="/auth/signin" className={styles.btnLogin}>
                  <span className={styles.lockIcon}>🔒</span>
                  Log In
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* FDIC Badge */}
        <div className={styles.fdicBar}>
          <div className={styles.container}>
            <div className={styles.fdicBadge}>
              <span className={styles.fdicIcon}>🏛️</span>
              <span className={styles.fdicText}>FDIC-Insured - Backed by the full faith and credit of the U.S. Government</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <div className={styles.heroText}>
              <h1 className={styles.heroTitle}>
                Welcome to simplified checking and payments.
              </h1>
              <p className={styles.heroDescription}>
                Seamlessly switch banks, manage your direct deposit, and streamline saved payment methods. Open a checking account today.
              </p>
              <div className={styles.heroActions}>
                <Link href="/auth/signup" className={styles.btnPrimary}>
                  Get Started
                </Link>
                <Link href="/products" className={styles.btnSecondary}>
                  Explore Products
                </Link>
              </div>
            </div>
            <div className={styles.heroImage}>
              <Image
                src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600&fit=crop"
                alt="Modern banking on mobile device"
                width={600}
                height={450}
                className={styles.heroImg}
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Products Grid */}
      <section className={styles.productsGrid}>
        <div className={styles.container}>
          <div className={styles.gridRow}>
            {products.map((product, index) => (
              <div key={index} className={styles.productCard}>
                <div className={styles.productIcon}>{product.icon}</div>
                <h3 className={styles.productTitle}>{product.title}</h3>
                <p className={styles.productDesc}>{product.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Offers */}
      <section className={styles.featuredSection}>
        <div className={styles.container}>
          <div className={styles.featuresRow}>
            {features.map((feature, index) => (
              <div key={index} className={styles.featureCard}>
                <div className={styles.featureImage}>
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    width={400}
                    height={300}
                    className={styles.featImg}
                  />
                </div>
                <div className={styles.featureContent}>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                  <Link href={feature.link} className={styles.featureLink}>
                    {feature.cta} →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className={styles.trustSection}>
        <div className={styles.container}>
          <div className={styles.trustGrid}>
            <div className={styles.trustBadge}>
              <span className={styles.trustIcon}>🏛️</span>
              <div>
                <div className={styles.trustTitle}>FDIC</div>
                <div className={styles.trustLabel}>Insured</div>
              </div>
            </div>
            <div className={styles.trustBadge}>
              <span className={styles.trustIcon}>🔒</span>
              <div>
                <div className={styles.trustTitle}>256-bit SSL</div>
                <div className={styles.trustLabel}>Encrypted</div>
              </div>
            </div>
            <div className={styles.trustBadge}>
              <span className={styles.trustIcon}>✅</span>
              <div>
                <div className={styles.trustTitle}>SOC 2</div>
                <div className={styles.trustLabel}>Compliant</div>
              </div>
            </div>
            <div className={styles.trustBadge}>
              <span className={styles.trustIcon}>💳</span>
              <div>
                <div className={styles.trustTitle}>PCI DSS</div>
                <div className={styles.trustLabel}>Certified</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className={styles.servicesSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2>Customer service at your fingertips</h2>
          </div>
          <div className={styles.servicesGrid}>
            {services.map((service, index) => (
              <div key={index} className={styles.serviceCard}>
                <div className={styles.serviceIcon}>{service.icon}</div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <Link href={service.link} className={styles.serviceLink}>
                  Learn More →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={styles.ctaContent}>
            <h2>Ready to Start Your Financial Journey?</h2>
            <p>Join thousands of satisfied customers who trust ZentriBank</p>
            <div className={styles.ctaActions}>
              <Link href="/auth/signup" className={styles.btnCtaPrimary}>
                Open Your Account
              </Link>
              <Link href="/contact" className={styles.btnCtaSecondary}>
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerMain}>
            <div className={styles.footerBrand}>
              <div className={styles.footerLogo}>
                <Image
                  src="/images/Logo.png"
                  alt="ZentriBank Logo"
                  width={220}
                  height={60}
                  className={styles.footerLogoImage}
                />
              </div>
              <p className={styles.footerTagline}>
                Your trusted partner in financial services
              </p>
            </div>

            <div className={styles.footerColumn}>
              <h4>Company</h4>
              <Link href="/about">About Us</Link>
              <Link href="/careers">Careers</Link>
              <Link href="/newsroom">Newsroom</Link>
              <Link href="/community">Community</Link>
            </div>

            <div className={styles.footerColumn}>
              <h4>Help</h4>
              <Link href="/contact">Contact Us</Link>
              <Link href="/support">Help Center</Link>
              <Link href="/security">Security Center</Link>
              <Link href="/accessibility">Accessibility</Link>
            </div>

            <div className={styles.footerColumn}>
              <h4>Resources</h4>
              <Link href="/locations">Branch Locator</Link>
              <Link href="/education">Financial Education</Link>
              <Link href="/rates">Rates</Link>
              <Link href="/forms">Forms & Documents</Link>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <div className={styles.footerLinks}>
              <Link href="/privacy">Privacy Rights</Link>
              <Link href="/terms">Terms of Service</Link>
              <Link href="/security">Security & Legal</Link>
              <Link href="/disclosures">Disclosures</Link>
            </div>
            <div className={styles.footerCopy}>
              <p>© 2024 ZentriBank. All rights reserved. Member FDIC. Equal Housing Lender.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}