"use client";

import Link from "next/link";
import {
  Download,
  Shield,
  Smartphone,
  CreditCard,
  ArrowLeftRight,
  ChevronLeft,
  Lock,
} from "lucide-react";
import styles from "./download.module.css";

export default function DownloadPage() {
  return (
    <div className={styles.page}>
      <Link href="/" className={styles.backLink}>
        <ChevronLeft size={16} />
        Back to Home
      </Link>

      <div className={styles.hero}>
        <span className={styles.badge}>Mobile Banking</span>
        <h1 className={styles.title}>
          Horizon Global Capital on Android
        </h1>
        <p className={styles.subtitle}>
          Access your accounts, transfer funds, and manage your portfolio — all
          from your Android device with enterprise-grade security.
        </p>
      </div>

      <div className={styles.content}>
        {/* Download Card */}
        <div className={styles.downloadCard}>
          <div className={styles.cardHeader}>
            <div className={styles.androidIcon}>
              <Smartphone size={24} color="#fff" />
            </div>
            <div>
              <h2 className={styles.cardTitle}>Android App</h2>
              <p className={styles.cardVersion}>Version 1.0.0 &bull; 16 MB</p>
            </div>
          </div>

          <a
            href="https://expo.dev/artifacts/eas/8iLyhDHUJFHeGvJi8nm74q.apk"
            download="HorizonGlobalCapital.apk"
            className={styles.downloadButton}
          >
            <Download className={styles.downloadIcon} />
            Download APK
          </a>

          <div className={styles.appMeta}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Requires</span>
              <span className={styles.metaValue}>Android 8+</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Size</span>
              <span className={styles.metaValue}>16 MB</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Updated</span>
              <span className={styles.metaValue}>Mar 2026</span>
            </div>
          </div>

          <div className={styles.securityNote}>
            <Shield className={styles.securityIcon} />
            <span>
              This app is digitally signed and verified by Horizon Global
              Capital. Your connection is encrypted with 256-bit TLS.
            </span>
          </div>
        </div>

        {/* Installation Instructions */}
        <div className={styles.instructions}>
          <h2 className={styles.instructionsTitle}>How to Install</h2>
          <ol className={styles.steps}>
            <li className={styles.step}>
              <span className={styles.stepNumber}>1</span>
              <div className={styles.stepContent}>
                <h3>Download the APK</h3>
                <p>
                  Tap the download button. The file will save to your
                  device&apos;s Downloads folder.
                </p>
              </div>
            </li>
            <li className={styles.step}>
              <span className={styles.stepNumber}>2</span>
              <div className={styles.stepContent}>
                <h3>Allow Installation</h3>
                <p>
                  When prompted, go to Settings &gt; Security and enable
                  &quot;Install from unknown sources&quot; for your browser.
                </p>
              </div>
            </li>
            <li className={styles.step}>
              <span className={styles.stepNumber}>3</span>
              <div className={styles.stepContent}>
                <h3>Open the APK</h3>
                <p>
                  Tap the downloaded file from your notifications or file
                  manager to begin installation.
                </p>
              </div>
            </li>
            <li className={styles.step}>
              <span className={styles.stepNumber}>4</span>
              <div className={styles.stepContent}>
                <h3>Sign In</h3>
                <p>
                  Open the app and sign in with your existing Horizon Global
                  Capital credentials.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </div>

      {/* Features Section */}
      <div className={styles.features}>
        <h2 className={styles.featuresTitle}>What You Can Do</h2>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <Smartphone size={20} />
            </div>
            <h3>Account Overview</h3>
            <p>View balances and transaction history in real time</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <ArrowLeftRight size={20} />
            </div>
            <h3>Fund Transfers</h3>
            <p>Send money domestically and internationally</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <CreditCard size={20} />
            </div>
            <h3>Card Management</h3>
            <p>Freeze, unfreeze, and manage your debit cards</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <Lock size={20} />
            </div>
            <h3>Secure Access</h3>
            <p>Biometric login and two-factor authentication</p>
          </div>
        </div>
      </div>
    </div>
  );
}
