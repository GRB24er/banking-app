"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import styles from "./security.module.css";

export default function SecurityPage() {
  const { data: session } = useSession();
  const [activeSection, setActiveSection] = useState('overview');

  const securityScore = 85;
  
  const recentActivity = [
    { id: 1, action: "Login", device: "Chrome on Windows", location: "San Francisco, CA", time: "2 minutes ago", status: "success" },
    { id: 2, action: "Password Changed", device: "Mobile App", location: "San Francisco, CA", time: "2 days ago", status: "success" },
    { id: 3, action: "Failed Login Attempt", device: "Unknown Browser", location: "New York, NY", time: "5 days ago", status: "failed" },
    { id: 4, action: "2FA Enabled", device: "Chrome on MacOS", location: "San Francisco, CA", time: "1 week ago", status: "success" }
  ];

  return (
    <div className={styles.wrapper}>
      <Sidebar />
      <div className={styles.main}>
        <Header />
        
        <div className={styles.content}>
          <div className={styles.pageHeader}>
            <div>
              <h1>Security Center</h1>
              <p>Protect your account and monitor security settings</p>
            </div>
            <div className={styles.securityScoreCard}>
              <div className={styles.scoreLabel}>Security Score</div>
              <div className={styles.scoreValue}>{securityScore}%</div>
              <div className={styles.scoreStatus}>Strong</div>
            </div>
          </div>

          {/* Security Status Cards */}
          <div className={styles.statusCards}>
            <div className={styles.statusCard}>
              <div className={styles.statusIcon} style={{ background: '#dcfce7' }}>
                <span style={{ color: '#16a34a' }}>✓</span>
              </div>
              <div className={styles.statusContent}>
                <h3>Two-Factor Authentication</h3>
                <p>Enabled - SMS to ****4567</p>
              </div>
              <button className={styles.manageBtn}>Manage</button>
            </div>

            <div className={styles.statusCard}>
              <div className={styles.statusIcon} style={{ background: '#dcfce7' }}>
                <span style={{ color: '#16a34a' }}>✓</span>
              </div>
              <div className={styles.statusContent}>
                <h3>Login Alerts</h3>
                <p>Active - Email & SMS</p>
              </div>
              <button className={styles.manageBtn}>Configure</button>
            </div>

            <div className={styles.statusCard}>
              <div className={styles.statusIcon} style={{ background: '#fef3c7' }}>
                <span style={{ color: '#f59e0b' }}>!</span>
              </div>
              <div className={styles.statusContent}>
                <h3>Password Strength</h3>
                <p>Last changed 45 days ago</p>
              </div>
              <button className={styles.updateBtn}>Update</button>
            </div>

            <div className={styles.statusCard}>
              <div className={styles.statusIcon} style={{ background: '#dcfce7' }}>
                <span style={{ color: '#16a34a' }}>✓</span>
              </div>
              <div className={styles.statusContent}>
                <h3>Device Management</h3>
                <p>3 trusted devices</p>
              </div>
              <button className={styles.manageBtn}>View Devices</button>
            </div>
          </div>

          {/* Security Features */}
          <div className={styles.featuresSection}>
            <h2>Security Features</h2>
            <div className={styles.featuresGrid}>
              <div className={styles.featureCard}>
                <div className={styles.featureHeader}>
                  <h3>🔐 Biometric Authentication</h3>
                  <label className={styles.switch}>
                    <input type="checkbox" defaultChecked />
                    <span className={styles.slider}></span>
                  </label>
                </div>
                <p>Use fingerprint or face recognition for quick and secure access</p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureHeader}>
                  <h3>📱 Device Trust</h3>
                  <label className={styles.switch}>
                    <input type="checkbox" defaultChecked />
                    <span className={styles.slider}></span>
                  </label>
                </div>
                <p>Remember trusted devices for 30 days</p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureHeader}>
                  <h3>🌍 Location Security</h3>
                  <label className={styles.switch}>
                    <input type="checkbox" />
                    <span className={styles.slider}></span>
                  </label>
                </div>
                <p>Block access from unusual locations</p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureHeader}>
                  <h3>⏰ Session Timeout</h3>
                  <select className={styles.timeoutSelect}>
                    <option>5 minutes</option>
                    <option selected>15 minutes</option>
                    <option>30 minutes</option>
                    <option>1 hour</option>
                  </select>
                </div>
                <p>Automatically log out after inactivity</p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className={styles.activitySection}>
            <div className={styles.activityHeader}>
              <h2>Recent Security Activity</h2>
              <button className={styles.viewAllBtn}>View All</button>
            </div>
            <div className={styles.activityList}>
              {recentActivity.map(activity => (
                <div key={activity.id} className={styles.activityItem}>
                  <div className={styles.activityIcon}>
                    {activity.status === 'success' ? '✓' : '⚠️'}
                  </div>
                  <div className={styles.activityDetails}>
                    <div className={styles.activityAction}>{activity.action}</div>
                    <div className={styles.activityMeta}>
                      {activity.device} • {activity.location} • {activity.time}
                    </div>
                  </div>
                  <div className={`${styles.activityStatus} ${activity.status === 'success' ? styles.success : styles.failed}`}>
                    {activity.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}