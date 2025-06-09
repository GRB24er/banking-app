// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  // 1) State to hold the dynamic greeting
  const [greeting, setGreeting] = useState<string>('Welcome');

  useEffect(() => {
    // 2) Determine local hour (0–23) on the client
    const hour = new Date().getHours();

    if (hour < 12) {
      setGreeting('Good morning');
    } else if (hour < 18) {
      setGreeting('Good afternoon');
    } else {
      setGreeting('Good evening');
    }
  }, []); // run once on mount

  return (
    <div className="root">
      {/* ============= HEADER ============= */}
      <header className="header">
        <div className="header-contents">
          {/* Bank Logo + Name */}
          <div className="brand">
            <Image
              src="/icons/logo.svg"
              alt="Horizonglobalcapital Logo"
              width={32}
              height={32}
              className="logo"
            />
            <span className="brand-name">Horizon</span>
          </div>

          {/* Navigation Links */}
          <nav className="nav-links">
            <Link href="/locations" className="nav-link">
              Locations
            </Link>
            <Link href="/help" className="nav-link">
              Help
            </Link>
            <Link href="/espanol" className="nav-link">
              Español
            </Link>

            {/* Search Icon */}
            <button className="icon-button" aria-label="Search">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="icon-search"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            {/* Sign On Button */}
            <Link href="/auth/signin" className="sign-on-button">
              Sign On
            </Link>
          </nav>
        </div>
      </header>

      {/* ============= MAIN CONTENT ============= */}
      <main className="main">
        {/* --- Left: Sign-In Card --- */}
        <div className="left-pane">
          <div className="sign-in-card">
            {/* 3) Use the dynamic greeting here */}
            <h2 className="card-title">{greeting}</h2>
            <p className="card-subtitle">Sign on to manage your accounts.</p>

            {/* Username */}
            <div className="field-group">
              <label htmlFor="username" className="visually-hidden">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                placeholder="Username"
                className="input-text"
              />
            </div>

            {/* Password */}
            <div className="field-group password-group">
              <label htmlFor="password" className="visually-hidden">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Password"
                className="input-text"
              />
              <button type="button" className="toggle-password">
                Show
              </button>
            </div>

            {/* Save Username */}
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="save-username"
                name="save-username"
                className="checkbox-input"
              />
              <label htmlFor="save-username" className="checkbox-label">
                Save username
              </label>
            </div>

            {/* Buttons */}
            <div className="button-group">
              <Link href="/auth/signin" className="primary-button">
                Sign On
              </Link>
              <Link href="/auth/signup" className="enroll-link">
                Enroll
              </Link>
            </div>

            {/* Footer Links */}
            <div className="footer-links">
              <Link href="/forgot" className="footer-link">
                Forgot username or password?
              </Link>
              <Link href="/security-center" className="footer-link">
                Security Center
              </Link>
              <Link href="/privacy" className="footer-link">
                Privacy, Cookies, and Legal
              </Link>
            </div>
          </div>
        </div>

        {/* --- Right: Promotion --- */}
        <div className="right-pane">
          <div className="promo-content">
            <h1 className="promo-title">$325 checking bonus on us</h1>
            <p className="promo-text">
              New customers open an eligible checking account with qualifying direct deposits.
            </p>
            <Link href="/auth/signup" className="secondary-button">
              Get started &gt;&gt;
            </Link>
          </div>
        </div>
      </main>

      {/* ============= STYLED-JSX ============= */}
      <style jsx>{`
        /* ====== Global Resets ====== */
        .root {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          margin: 0;
          padding: 0;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f9fafb; /* Light gray overall */
        }

        /* ====== HEADER ====== */
        .header {
          background-color: #1e40af; /* Horizons primary navy */
          color: white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header-contents {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
        }
        .brand {
          display: flex;
          align-items: center;
        }
        .logo {
          height: 32px;
          width: auto;
        }
        .brand-name {
          margin-left: 8px;
          font-size: 1.25rem; /* 20px */
          font-weight: 600;
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        .nav-link {
          color: white;
          font-size: 0.875rem; /* 14px */
          text-decoration: none;
        }
        .nav-link:hover {
          text-decoration: underline;
        }
        .icon-button {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 50%;
        }
        .icon-button:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        .icon-search {
          width: 20px;
          height: 20px;
          color: white;
        }
        .sign-on-button {
          background-color: white;
          color: #1e40af;
          padding: 8px 16px;
          font-size: 0.875rem; /* 14px */
          font-weight: 500;
          border-radius: 9999px;
          text-decoration: none;
          white-space: nowrap;
        }
        .sign-on-button:hover {
          background-color: #f1f5f9; /* Slight off-white on hover */
        }

        /* ====== MAIN ====== */
        .main {
          flex: 1;
          display: flex;
          flex-direction: column; /* stack on small screens */
        }

        /* Left Pane (Sign-In) */
        .left-pane {
          background-color: #ffffff; /* White background for card container on large screens */
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 48px 24px;
        }
        .sign-in-card {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          padding: 32px;
          max-width: 380px;
          width: 100%;
        }
        .card-title {
          margin: 0;
          font-size: 1.5rem; /* 24px */
          font-weight: 600;
          color: #1f2937; /* Dark gray for text */
        }
        .card-subtitle {
          margin-top: 8px;
          margin-bottom: 24px;
          font-size: 1rem; /* 16px */
          color: #4b5563; /* Gray-600 */
        }

        /* Fields */
        .field-group {
          margin-bottom: 16px;
        }
        .input-text {
          width: 100%;
          border: none;
          border-bottom: 1px solid #d1d5db; /* Gray-300 */
          padding: 8px 0;
          font-size: 1rem; /* 16px */
          color: #1f2937;
          background: transparent;
        }
        .input-text:focus {
          outline: none;
          border-bottom-color: #1e40af; /* Navy accent on focus */
        }
        .password-group {
          display: flex;
          align-items: center;
        }
        .toggle-password {
          margin-left: 8px;
          background: none;
          border: none;
          color: #1e40af; /* Navy accent */
          font-size: 0.875rem; /* 14px */
          cursor: pointer;
        }
        .toggle-password:hover {
          text-decoration: underline;
        }

        /* Checkbox */
        .checkbox-group {
          display: flex;
          align-items: center;
          margin-bottom: 24px;
        }
        .checkbox-input {
          width: 16px;
          height: 16px;
          margin-right: 8px;
          accent-color: #1e40af; /* Navy accent */
        }
        .checkbox-label {
          font-size: 0.875rem; /* 14px */
          color: #374151; /* Gray-700 */
        }

        /* Buttons */
        .button-group {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }
        .primary-button {
          flex: 1;
          background-color: #1e40af; /* Primary navy */
          color: white;
          padding: 12px 0;
          font-size: 1rem; /* 16px */
          font-weight: 500;
          border-radius: 9999px;
          text-align: center;
          text-decoration: none;
          display: inline-block;
        }
        .primary-button:hover {
          background-color: #1c3a9a; /* Darker navy on hover */
        }
        .enroll-link {
          font-size: 0.875rem; /* 14px */
          color: #1e40af;
          text-decoration: none;
        }
        .enroll-link:hover {
          text-decoration: underline;
        }

        /* Footer Links */
        .footer-links {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .footer-link {
          font-size: 0.875rem; /* 14px */
          color: #4b5563; /* Gray-600 */
          text-decoration: none;
        }
        .footer-link:hover {
          text-decoration: underline;
        }

        /* Right Pane (Promotion) */
        .right-pane {
          background-color: #f3f4f6; /* Gray-100 */
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 48px 24px;
        }
        .promo-content {
          max-width: 500px;
          width: 100%;
          text-align: center;
        }
        .promo-title {
          margin: 0;
          font-size: 2rem; /* 32px */
          font-weight: 700;
          color: #1f2937; /* Dark gray */
        }
        .promo-text {
          margin-top: 16px;
          margin-bottom: 24px;
          font-size: 1.125rem; /* 18px */
          color: #4b5563; /* Gray-600 */
        }
        .secondary-button {
          display: inline-block;
          font-size: 1rem; /* 16px */
          font-weight: 500;
          color: #1e40af; /* Navy */
          padding: 12px 24px;
          border: 2px solid #1e40af;
          border-radius: 9999px;
          text-decoration: none;
        }
        .secondary-button:hover {
          background-color: rgba(30, 64, 175, 0.1); /* Light navy tint */
        }

        /* ====== RESPONSIVE ====== */
        @media (min-width: 1024px) {
          .main {
            flex-direction: row; /* Side-by-side on large screens */
          }
          .left-pane,
          .right-pane {
            flex: 1;
            padding: 0;
            height: auto;
          }
          .left-pane {
            background-color: #ffffff; /* White on large */
            justify-content: center;
            align-items: center;
            padding: 48px 24px;
          }
          .right-pane {
            justify-content: center;
            align-items: center;
            padding: 48px 24px;
          }
          .promo-content {
            text-align: left;
          }
        }

        /* ====== Utility ====== */
        .visually-hidden {
          position: absolute;
          width: 1px;
          height: 1px;
          margin: -1px;
          padding: 0;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
    </div>
  );
}
