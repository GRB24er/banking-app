"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import styles from "./settings.module.css";

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [savedMessage, setSavedMessage] = useState('');

  const handleSave = () => {
    setSavedMessage('Settings saved successfully');
    setTimeout(() => setSavedMessage(''), 3000);
  };

  return (
    <div className={styles.wrapper}>
      <Sidebar />
      <div className={styles.main}>
        <Header />
        
        <div className={styles.content}>
          <div className={styles.pageHeader}>
            <h1>Settings</h1>
            <p>Manage your account preferences and settings</p>
          </div>

          {savedMessage && (
            <div className={styles.successMessage}>
              ✓ {savedMessage}
            </div>
          )}

          <div className={styles.settingsContainer}>
            <div className={styles.settingsTabs}>
              <button 
                className={activeTab === 'profile' ? styles.activeTab : ''}
                onClick={() => setActiveTab('profile')}
              >
                <span>👤</span> Profile
              </button>
              <button 
                className={activeTab === 'security' ? styles.activeTab : ''}
                onClick={() => setActiveTab('security')}
              >
                <span>🔒</span> Security
              </button>
              <button 
                className={activeTab === 'notifications' ? styles.activeTab : ''}
                onClick={() => setActiveTab('notifications')}
              >
                <span>🔔</span> Notifications
              </button>
              <button 
                className={activeTab === 'privacy' ? styles.activeTab : ''}
                onClick={() => setActiveTab('privacy')}
              >
                <span>🛡️</span> Privacy
              </button>
              <button 
                className={activeTab === 'billing' ? styles.activeTab : ''}
                onClick={() => setActiveTab('billing')}
              >
                <span>💳</span> Billing
              </button>
            </div>

            <div className={styles.settingsContent}>
              {activeTab === 'profile' && (
                <div className={styles.profileSettings}>
                  <h2>Profile Information</h2>
                  <form className={styles.settingsForm}>
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>First Name</label>
                        <input type="text" defaultValue="Hajand" />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Last Name</label>
                        <input type="text" defaultValue="Morgan" />
                      </div>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Email Address</label>
                      <input type="email" defaultValue={session?.user?.email || ''} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Phone Number</label>
                      <input type="tel" defaultValue="+1 (555) 123-4567" />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Address</label>
                      <input type="text" defaultValue="123 Main Street, San Francisco, CA 94105" />
                    </div>
                    <button type="button" className={styles.saveBtn} onClick={handleSave}>
                      Save Changes
                    </button>
                  </form>
                </div>
              )}

              {activeTab === 'security' && (
                <div className={styles.securitySettings}>
                  <h2>Security Settings</h2>
                  <div className={styles.securityOptions}>
                    <div className={styles.securityItem}>
                      <div>
                        <h3>Two-Factor Authentication</h3>
                        <p>Add an extra layer of security to your account</p>
                      </div>
                      <label className={styles.switch}>
                        <input type="checkbox" defaultChecked />
                        <span className={styles.slider}></span>
                      </label>
                    </div>
                    <div className={styles.securityItem}>
                      <div>
                        <h3>Biometric Login</h3>
                        <p>Use fingerprint or face recognition</p>
                      </div>
                      <label className={styles.switch}>
                        <input type="checkbox" />
                        <span className={styles.slider}></span>
                      </label>
                    </div>
                    <div className={styles.securityItem}>
                      <div>
                        <h3>Login Alerts</h3>
                        <p>Get notified of new sign-ins</p>
                      </div>
                      <label className={styles.switch}>
                        <input type="checkbox" defaultChecked />
                        <span className={styles.slider}></span>
                      </label>
                    </div>
                  </div>
                  <div className={styles.passwordSection}>
                    <h3>Change Password</h3>
                    <form className={styles.settingsForm}>
                      <div className={styles.formGroup}>
                        <label>Current Password</label>
                        <input type="password" />
                      </div>
                      <div className={styles.formGroup}>
                        <label>New Password</label>
                        <input type="password" />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Confirm New Password</label>
                        <input type="password" />
                      </div>
                      <button type="button" className={styles.saveBtn}>
                        Update Password
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className={styles.notificationSettings}>
                  <h2>Notification Preferences</h2>
                  <div className={styles.notificationOptions}>
                    <div className={styles.notificationItem}>
                      <div>
                        <h3>Transaction Alerts</h3>
                        <p>Receive alerts for all transactions</p>
                      </div>
                      <label className={styles.switch}>
                        <input type="checkbox" defaultChecked />
                        <span className={styles.slider}></span>
                      </label>
                    </div>
                    <div className={styles.notificationItem}>
                      <div>
                        <h3>Account Updates</h3>
                        <p>Important account information</p>
                      </div>
                      <label className={styles.switch}>
                        <input type="checkbox" defaultChecked />
                        <span className={styles.slider}></span>
                      </label>
                    </div>
                    <div className={styles.notificationItem}>
                      <div>
                        <h3>Marketing Emails</h3>
                        <p>Promotions and special offers</p>
                      </div>
                      <label className={styles.switch}>
                        <input type="checkbox" />
                        <span className={styles.slider}></span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}