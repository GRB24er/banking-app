"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./landing.module.css";

export default function LandingPage() {
  const [showModal, setShowModal] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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

  const features = [
  {
    icon: "🔒",
    title: "Advanced Security",
    description: "Two-factor authentication, biometric login, and real-time fraud monitoring protect your accounts 24/7."
  },
  {
    icon: "📧",
    title: "Smart Notifications",
    description: "Instant email alerts for every transaction, security event, and account activity to keep you informed."
  },
  {
    icon: "💸",
    title: "Instant Transfers",
    description: "Send money instantly to anyone, anywhere with our secure, real-time transfer system."
  },
  {
    icon: "📊",
    title: "Financial Insights",
    description: "AI-powered analytics and personalized recommendations to help you achieve your financial goals."
  }
];

  const stats = [
    { value: "100K+", label: "Trusted Customers" },
    { value: "$45.46M", label: "Assets Under Management" },
    { value: "99.9%", label: "Uptime Guarantee" },
    { value: "24/7", label: "Customer Support" }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Business Owner",
      content: "Horizon Global Capital has transformed how I manage my business finances. The security features give me complete peace of mind.",
      rating: 5,
      avatar: "https://i.imgur.com/MqtsC2A_d.webp?maxwidth=760&fidelity=grand"
    },
    {
      name: "Michael Chen",
      role: "Investment Manager", 
      content: "The real-time analytics and instant notifications have made managing my portfolio incredibly efficient.",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face"
    },
    {
      name: "Emily Rodriguez",
      role: "Tech Entrepreneur",
      content: "Best banking experience I've ever had. The two-factor authentication and email alerts keep me informed at all times.",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face"
    }
  ];

  return (
    <div className={styles.landingPage}>
      {/* Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeModal} onClick={() => setShowModal(false)}>×</button>
            
            <div className={styles.modalHeader}>
              <div className={styles.modalIcon}>🎉</div>
              <h2 className={styles.modalTitle}>Welcome to ZentriBank</h2>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.announcement}>
                <h3>🌟 Special Launch Offer</h3>
                <p>Experience premium banking with our exclusive benefits:</p>
                <ul>
                  <li>✓ No monthly fees on Premier accounts</li>
                  <li>✓ Advanced two-factor authentication</li>
                  <li>✓ Real-time email notifications</li>
                  <li>✓ 24/7 priority customer support</li>
                </ul>
              </div>

              <div className={styles.branchHours}>
                <h3>🏦 Digital Banking</h3>
                <div className={styles.hoursGrid}>
                  <div>
                    <strong>Online Banking</strong>
                    <p>Available 24/7</p>
                  </div>
                  <div>
                    <strong>Customer Support</strong>
                    <p>Mon-Fri 8AM-8PM</p>
                  </div>
                  <div>
                    <strong>Mobile App</strong>
                    <p>iOS & Android</p>
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

      {/* Header */}
      <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
        <div className={styles.headerContent}>
          <div className={styles.brand}>
            <div className={styles.logoWrapper}>
              <span className={styles.logoIcon}>🏦</span>
            </div>
            <div className={styles.brandText}>
              <span className={styles.brandName}>ZentriBank</span>
              <span className={styles.brandTagline}>Global Capital</span>
            </div>
          </div>

          <nav className={styles.nav}>
            <div className={styles.navItem}>
              <Link href="#personal">Personal</Link>
            </div>
            <div className={styles.navItem}>
              <Link href="#business">Business</Link>
            </div>
            <div className={styles.navItem}>
              <Link href="#wealth">Wealth</Link>
            </div>
            <Link href="#about">About</Link>
          </nav>

          <div className={styles.authButtons}>
            <Link href="/auth/signin" className={styles.loginButton}>
              🔐 Sign In
            </Link>
            <Link href="/auth/signup" className={styles.signupButton}>
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroSlider}>
          <div className={styles.heroSlide}>
            <div className={styles.heroContent}>
              <div className={styles.heroText}>
                <h1 className={styles.heroTitle}>
                  Transform Your <span>Financial Future</span>
                </h1>
                <p className={styles.heroSubtitle}>
                  Experience premium banking with advanced security, real-time notifications, 
                  and seamless digital transactions designed for modern life.
                </p>
                <div className={styles.heroActions}>
                  <Link href="/auth/signup" className={styles.heroPrimary}>
                    Open Premium Account
                  </Link>
                  <Link href="/auth/signin" className={styles.heroSecondary}>
                    Access Your Account
                  </Link>
                </div>
                <div className={styles.heroStats}>
                  <div className={styles.stat}>
                    <span className={styles.statValue}>100K+</span>
                    <span className={styles.statLabel}>Trusted Customers</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statValue}>$45.46M</span>
                    <span className={styles.statLabel}>Assets Managed</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statValue}>99.9%</span>
                    <span className={styles.statLabel}>Uptime</span>
                  </div>
                </div>
              </div>
              <div className={styles.heroVisual}>
                <div className={styles.heroImageContainer}>
                  <Image
                    src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop"
                    alt="Professional using modern banking dashboard"
                    width={800}
                    height={600}
                    className={styles.heroImage}
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className={styles.trustSection}>
        <div className={styles.container}>
          <div className={styles.trustGrid}>
            <div className={styles.trustItem}>
              <div className={styles.trustBadge}>
                <div className={styles.trustIcon}>🏛️</div>
                <div>
                  <div className={styles.trustTitle}>FDIC</div>
                  <div className={styles.trustSubtitle}>Insured</div>
                </div>
              </div>
            </div>
            <div className={styles.trustItem}>
              <div className={styles.trustBadge}>
                <div className={styles.trustIcon}>🔒</div>
                <div>
                  <div className={styles.trustTitle}>256-bit</div>
                  <div className={styles.trustSubtitle}>SSL Secured</div>
                </div>
              </div>
            </div>
            <div className={styles.trustItem}>
              <div className={styles.trustBadge}>
                <div className={styles.trustIcon}>✅</div>
                <div>
                  <div className={styles.trustTitle}>SOC 2</div>
                  <div className={styles.trustSubtitle}>Compliant</div>
                </div>
              </div>
            </div>
            <div className={styles.trustItem}>
              <div className={styles.trustBadge}>
                <div className={styles.trustIcon}>💳</div>
                <div>
                  <div className={styles.trustTitle}>PCI DSS</div>
                  <div className={styles.trustSubtitle}>Certified</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

     {/* Features Section */}
<section className={styles.features}>
  <div className={styles.container}>
    <div className={styles.sectionHeader}>
      <h2>Why Choose ZentriBank</h2>
      <p>Experience banking reimagined with cutting-edge technology and personalized service</p>
    </div>
    
    <div className={styles.featuresGrid}>
      {features.map((feature, index) => (
        <div key={index} className={styles.featureCard}>
          <div className={styles.featureIcon}>
            <span className={styles.iconEmoji}>{feature.icon}</span>
          </div>
          <h3>{feature.title}</h3>
          <p>{feature.description}</p>
        </div>
      ))}
    </div>
  </div>
</section>

      {/* Stats Section */}
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

      {/* Security Section */}
      <section className={styles.security}>
        <div className={styles.container}>
          <div className={styles.securityContent}>
            <div className={styles.securityText}>
              <h2>Bank-Grade Security</h2>
              <p>
                Your security is our top priority. We use military-grade encryption and cutting-edge 
                security protocols to protect your financial data.
              </p>
              <ul className={styles.securityFeatures}>
                <li>256-bit SSL encryption</li>
                <li>Two-factor authentication</li>
                <li>Real-time fraud monitoring</li>
                <li>Biometric authentication</li>
                <li>Secure email notifications</li>
                <li>24/7 security monitoring</li>
              </ul>
            </div>
            
            <div className={styles.securityVisual}>
              <div className={styles.securityImage}>
                <div className={styles.shieldContainer}>
                  <div className={styles.shield}>🛡️</div>
                  <div className={styles.securityText}>SECURE</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

     {/* Mobile App Section */}
<section className={styles.appShowcase}>
  <div className={styles.container}>
    <div className={styles.appContent}>
      <div className={styles.appText}>
        <h2>Banking in Your Pocket</h2>
        <p>
          Access your accounts, make transfers, and manage your finances anywhere 
          with our secure mobile banking app.
        </p>
        <div className={styles.appFeatures}>
          <div className={styles.appFeature}>
            <span className={styles.featureIcon}>🔐</span>
            <span>Bank-grade security</span>
          </div>
          <div className={styles.appFeature}>
            <span className={styles.featureIcon}>📧</span>
            <span>Instant notifications</span>
          </div>
          <div className={styles.appFeature}>
            <span className={styles.featureIcon}>📱</span>
            <span>Biometric login</span>
          </div>
        </div>
        <div className={styles.appButtons}>
          <div className={styles.downloadBtn}>
            <div className={styles.storeBadge}>
              <span>📱</span>
              <div>
                <div className={styles.downloadText}>Download on the</div>
                <div className={styles.storeName}>App Store</div>
              </div>
            </div>
          </div>
          <div className={styles.downloadBtn}>
            <div className={styles.storeBadge}>
              <span>📱</span>
              <div>
                <div className={styles.downloadText}>Get it on</div>
                <div className={styles.storeName}>Google Play</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className={styles.phoneContainer}>
        <div className={styles.phoneFrame}>
          <div className={styles.phoneScreen}>
            <Image
              src="/images/app/mobile-app-screenshot.png"
              alt="Horizon Banking Mobile App"
              width={280}
              height={560}
              className={styles.mobileAppImage}
              priority
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

      {/* Testimonials */}
      <section className={styles.testimonials}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2>What Our Clients Say</h2>
            <p>Join thousands of satisfied customers who trust us with their financial future</p>
          </div>
          
          <div className={styles.testimonialsGrid}>
            {testimonials.map((testimonial, index) => (
              <div key={index} className={styles.testimonialCard}>
                <div className={styles.testimonialHeader}>
                  <Image
                    src={testimonial.avatar}
                    alt={`${testimonial.name} avatar`}
                    width={60}
                    height={60}
                    className={styles.testimonialAvatar}
                  />
                  <div className={styles.testimonialInfo}>
                    <strong>{testimonial.name}</strong>
                    <span>{testimonial.role}</span>
                  </div>
                </div>
                <div className={styles.stars}>
                  {'★'.repeat(testimonial.rating)}
                </div>
                <p>"{testimonial.content}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className={styles.container}>
          <div className={styles.ctaContent}>
            <h2>Ready to Start Your Financial Journey?</h2>
            <p>Join ZentriBank today and experience banking excellence with advanced security and smart notifications</p>
            <div className={styles.ctaButtons}>
              <Link href="/auth/signup" className={styles.ctaPrimary}>
                Open Your Account
              </Link>
              <Link href="/auth/signin" className={styles.ctaSecondary}>
                Sign In to Banking
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerContent}>
            <div className={styles.footerSection}>
              <div className={styles.footerBrand}>
                <div className={styles.footerLogo}>🏦</div>
                <h4>ZentriBank</h4>
              </div>
              <p>Premier digital banking with cutting-edge security, two-factor authentication, and real-time notifications.</p>
              <div className={styles.socialLinks}>
                <a href="#">📘</a>
                <a href="#">🐦</a>
                <a href="#">💼</a>
                <a href="#">📷</a>
              </div>
            </div>
            
            <div className={styles.footerSection}>
              <h4>Banking Services</h4>
              <Link href="/accounts/checking">Checking Accounts</Link>
              <Link href="/accounts/savings">Savings Accounts</Link>
              <Link href="/loans">Loans & Credit</Link>
              <Link href="/cards">Credit Cards</Link>
              <Link href="/business">Business Banking</Link>
            </div>
            
            <div className={styles.footerSection}>
              <h4>Security & Support</h4>
              <Link href="/security">Security Center</Link>
              <Link href="/two-factor-auth">Two-Factor Auth</Link>
              <Link href="/notifications">Email Notifications</Link>
              <Link href="/support">Help Center</Link>
              <Link href="/contact">Contact Us</Link>
            </div>
            
            <div className={styles.footerSection}>
              <h4>Company</h4>
              <Link href="/about">About Us</Link>
              <Link href="/careers">Careers</Link>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms of Service</Link>
              <Link href="/accessibility">Accessibility</Link>
            </div>
          </div>
          
          <div className={styles.footerBottom}>
            <p>© 2024 ZentriBank. All rights reserved. Member FDIC. Equal Housing Lender.</p>
            <div className={styles.footerCertifications}>
              <span className={styles.certBadge}>🏛️ FDIC</span>
              <span className={styles.certBadge}>🔒 SSL</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}