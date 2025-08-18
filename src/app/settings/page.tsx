"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./settings.module.css";
import { motion } from "framer-motion";

type ApiResponse = {
  ok: boolean;
  message?: string;
  error?: string;
  requireReauth?: boolean;
};

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Profile state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Read-only account info
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [bitcoinAddress, setBitcoinAddress] = useState("");

  // Password state (single field)
  const [newPassword, setNewPassword] = useState("");

  // UI state
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setName(session.user.name || "");
      setEmail(session.user.email || "");
      setAccountNumber((session.user as any).accountNumber || "");
      setRoutingNumber((session.user as any).routingNumber || "");
      setBitcoinAddress((session.user as any).bitcoinAddress || "");
    }
  }, [status, session]);

  // ----- Profile update (name + email) -----
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!name.trim() || !email.trim()) {
      setErrorMsg("Name and email cannot be empty.");
      return;
    }

    setLoadingProfile(true);
    try {
      const res = await fetch("/api/user/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "profile",
          name: name.trim(),
          email: email.trim(),
        }),
      });

      const data = (await res.json()) as ApiResponse;

      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || "Update failed.");
        return;
      }

      setSuccessMsg(data.message || "Profile updated successfully!");
      setTimeout(() => router.refresh(), 300);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setErrorMsg("Network or server error. Please try again.");
    } finally {
      setLoadingProfile(false);
    }
  };

  // ----- Password update (no current/confirm) -----
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (newPassword.length < 8) {
      setErrorMsg("New password must be at least 8 characters long.");
      return;
    }

    setLoadingPassword(true);
    try {
      const res = await fetch("/api/user/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "password",
          newPassword, // only this field
        }),
      });

      if (res.status === 401) {
        setErrorMsg("Your session expired. Please sign in again.");
        setTimeout(() => router.push("/auth/signin"), 800);
        return;
      }

      const data = (await res.json()) as ApiResponse;

      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || "Failed to update password.");
        return;
      }

      setSuccessMsg(data.message || "Password updated successfully.");
      // Force re-auth so the new password is required next login
      if (data.requireReauth) {
        setTimeout(() => signOut({ callbackUrl: "/auth/signin" }), 800);
      } else {
        setNewPassword("");
      }
    } catch (error: any) {
      console.error("Error updating password:", error);
      setErrorMsg("Network or server error. Please try again.");
    } finally {
      setLoadingPassword(false);
    }
  };

  if (status !== "authenticated") {
    return <p>Loading…</p>;
  }

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.settingsContainer}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <button onClick={() => router.back()} className={styles.backBtn}>
          ← Back
        </button>

        <h1 className={styles.settingsTitle}>Settings</h1>

        {errorMsg && <div className={styles.errorMsg}>{errorMsg}</div>}
        {successMsg && <div className={styles.successMsg}>{successMsg}</div>}

        {/* ---------- PROFILE FORM ---------- */}
        <form onSubmit={handleProfileUpdate}>
          <div className={styles.formField}>
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className={styles.formField}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.formField}>
            <label>Account Number</label>
            <input
              type="text"
              value={accountNumber}
              readOnly
              className={styles.readOnlyField}
            />
          </div>

          <div className={styles.formField}>
            <label>Routing Number</label>
            <input
              type="text"
              value={routingNumber}
              readOnly
              className={styles.readOnlyField}
            />
          </div>

          <div className={styles.formField}>
            <label>Bitcoin Address</label>
            <input
              type="text"
              value={bitcoinAddress}
              readOnly
              className={styles.readOnlyField}
            />
          </div>

          <button type="submit" disabled={loadingProfile} className={styles.saveBtn}>
            {loadingProfile ? "Updating…" : "Update Profile"}
          </button>
        </form>

        <hr style={{ margin: "24px 0", borderColor: "#e5e7eb" }} />

        {/* ---------- CHANGE PASSWORD (NEW ONLY) ---------- */}
        <form onSubmit={handlePasswordUpdate}>
          <div className={styles.formField}>
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              required
            />
          </div>

          <button type="submit" disabled={loadingPassword} className={styles.saveBtn}>
            {loadingPassword ? "Saving…" : "Save Password"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
