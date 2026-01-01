"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./signup.module.css";

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  dob: string;
  nationality: string;
  idType: string;
  idNumber: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  employmentStatus: string;
  monthlyIncome: string;
  purpose: string;
  terms: boolean;
  privacy: boolean;
  marketing: boolean;
};

const countries = [
  "United Kingdom", "Germany", "France", "Netherlands", "Switzerland", "Austria",
  "Belgium", "Luxembourg", "Ireland", "Italy", "Spain", "Portugal", "Sweden",
  "Norway", "Denmark", "Finland", "Japan", "Singapore", "Hong Kong", "South Korea",
  "Taiwan", "Malaysia", "Thailand", "Philippines", "Indonesia", "Vietnam"
];

const employmentOptions = [
  "Employed Full-time", "Employed Part-time", "Self-employed", "Unemployed",
  "Student", "Retired", "Other"
];

const incomeRanges = [
  "Under €25,000", "€25,000 - €50,000", "€50,000 - €75,000", 
  "€75,000 - €100,000", "€100,000 - €150,000", "Over €150,000"
];

const accountPurposes = [
  "Personal Banking", "Business Banking", "Investment", "Savings", 
  "International Transfers", "Other"
];

export default function SignUpPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    dob: "",
    nationality: "",
    idType: "passport",
    idNumber: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
    phone: "",
    employmentStatus: "",
    monthlyIncome: "",
    purpose: "",
    terms: false,
    privacy: false,
    marketing: false,
  });
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [emailExists, setEmailExists] = useState(false);

  useEffect(() => {
    const calculateStrength = (password: string) => {
      let strength = 0;
      if (password.length >= 8) strength += 1;
      if (/[a-z]/.test(password)) strength += 1;
      if (/[A-Z]/.test(password)) strength += 1;
      if (/[0-9]/.test(password)) strength += 1;
      if (/[^A-Za-z0-9]/.test(password)) strength += 1;
      return strength;
    };
    setPasswordStrength(calculateStrength(form.password));
  }, [form.password]);

  useEffect(() => {
    const checkEmail = async () => {
      if (form.email.includes('@')) {
        const exists = form.email === 'test@test.com';
        setEmailExists(exists);
      }
    };
    
    const timer = setTimeout(checkEmail, 500);
    return () => clearTimeout(timer);
  }, [form.email]);

  const calculateAge = (dob: string) => {
    if (!dob) return 0;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm({ ...form, [name]: checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const validateStep = (step: number) => {
    setErrorMsg("");
    
    switch (step) {
      case 1:
        if (!form.firstName.trim()) {
          setErrorMsg("First name is required");
          return false;
        }
        if (!form.lastName.trim()) {
          setErrorMsg("Last name is required");
          return false;
        }
        if (!form.email || emailExists) {
          setErrorMsg(emailExists ? "Email already registered" : "Valid email is required");
          return false;
        }
        if (passwordStrength < 3) {
          setErrorMsg("Password must be stronger (use uppercase, lowercase, numbers, and symbols)");
          return false;
        }
        if (form.password !== form.confirmPassword) {
          setErrorMsg("Passwords do not match");
          return false;
        }
        break;
        
      case 2:
        const age = calculateAge(form.dob);
        if (age < 18) {
          setErrorMsg("You must be at least 18 years old");
          return false;
        }
        if (!form.nationality) {
          setErrorMsg("Please select your nationality");
          return false;
        }
        if (!form.idNumber.trim()) {
          setErrorMsg("ID number is required");
          return false;
        }
        break;
        
      case 3:
        if (!form.address.trim() || !form.city.trim() || !form.postalCode.trim() || !form.country) {
          setErrorMsg("All address fields are required");
          return false;
        }
        if (!/^\+\d{10,15}$/.test(form.phone)) {
          setErrorMsg("Phone number must include country code (e.g., +44 for UK)");
          return false;
        }
        break;
        
      case 4:
        if (!form.employmentStatus || !form.monthlyIncome || !form.purpose) {
          setErrorMsg("Please complete all fields");
          return false;
        }
        if (!form.terms || !form.privacy) {
          setErrorMsg("You must accept the terms and privacy policy");
          return false;
        }
        break;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
    setErrorMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(4)) return;
    
    setLoading(true);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setErrorMsg(data.message || "Registration failed. Please try again.");
      return;
    }

    router.push("/auth/signin?registered=1");
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return "#ef4444";
    if (passwordStrength <= 2) return "#f59e0b";
    if (passwordStrength <= 3) return "#eab308";
    if (passwordStrength <= 4) return "#22c55e";
    return "#10b981";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 1) return "Weak";
    if (passwordStrength <= 2) return "Fair";
    if (passwordStrength <= 3) return "Good";
    if (passwordStrength <= 4) return "Strong";
    return "Very Strong";
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className={styles.stepContent}>
            <div className={styles.stepHeader}>
              <div className={styles.stepIcon}>◆</div>
              <h2 className={styles.stepTitle}>Account Credentials</h2>
              <p className={styles.stepSubtitle}>Create your secure banking profile</p>
            </div>
            
            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <label htmlFor="firstName">First Name</label>
                <input
                  id="firstName"
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                  placeholder="John"
                  autoComplete="given-name"
                />
              </div>
              
              <div className={styles.formField}>
                <label htmlFor="lastName">Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                  placeholder="Smith"
                  autoComplete="family-name"
                />
              </div>
            </div>

            <div className={styles.formField}>
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="john.smith@example.com"
                autoComplete="email"
                className={emailExists ? styles.inputError : ''}
              />
              {emailExists && <span className={styles.fieldError}>✕ Email already registered</span>}
            </div>

            <div className={styles.formField}>
              <label htmlFor="password">Create Password</label>
              <div className={styles.passwordWrapper}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="Create a secure password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              
              {form.password && (
                <div className={styles.passwordStrength}>
                  <div className={styles.strengthBars}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div 
                        key={i}
                        className={`${styles.strengthBar} ${i <= passwordStrength ? styles.strengthBarActive : ''}`}
                        style={{ 
                          backgroundColor: i <= passwordStrength ? getPasswordStrengthColor() : undefined 
                        }}
                      />
                    ))}
                  </div>
                  <span 
                    className={styles.strengthText}
                    style={{ color: getPasswordStrengthColor() }}
                  >
                    {getPasswordStrengthText()}
                  </span>
                </div>
              )}
              
              <div className={styles.passwordReqs}>
                <div className={`${styles.reqItem} ${form.password.length >= 8 ? styles.reqMet : ''}`}>
                  {form.password.length >= 8 ? '✓' : '○'} 8+ characters
                </div>
                <div className={`${styles.reqItem} ${/[a-z]/.test(form.password) ? styles.reqMet : ''}`}>
                  {/[a-z]/.test(form.password) ? '✓' : '○'} Lowercase
                </div>
                <div className={`${styles.reqItem} ${/[A-Z]/.test(form.password) ? styles.reqMet : ''}`}>
                  {/[A-Z]/.test(form.password) ? '✓' : '○'} Uppercase
                </div>
                <div className={`${styles.reqItem} ${/[0-9]/.test(form.password) ? styles.reqMet : ''}`}>
                  {/[0-9]/.test(form.password) ? '✓' : '○'} Number
                </div>
                <div className={`${styles.reqItem} ${/[^A-Za-z0-9]/.test(form.password) ? styles.reqMet : ''}`}>
                  {/[^A-Za-z0-9]/.test(form.password) ? '✓' : '○'} Symbol
                </div>
              </div>
            </div>

            <div className={styles.formField}>
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Re-enter your password"
                autoComplete="new-password"
                className={form.confirmPassword && form.password !== form.confirmPassword ? styles.inputError : ''}
              />
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <span className={styles.fieldError}>✕ Passwords do not match</span>
              )}
              {form.confirmPassword && form.password === form.confirmPassword && (
                <span className={styles.fieldSuccess}>✓ Passwords match</span>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className={styles.stepContent}>
            <div className={styles.stepHeader}>
              <div className={styles.stepIcon}>●</div>
              <h2 className={styles.stepTitle}>Identity Verification</h2>
              <p className={styles.stepSubtitle}>Regulatory compliance requirement</p>
            </div>
            
            <div className={styles.formField}>
              <label htmlFor="dob">Date of Birth</label>
              <input
                id="dob"
                type="date"
                name="dob"
                value={form.dob}
                onChange={handleChange}
                required
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
              />
              {form.dob && calculateAge(form.dob) < 18 && (
                <span className={styles.fieldError}>✕ Must be 18 or older</span>
              )}
            </div>

            <div className={styles.formField}>
              <label htmlFor="nationality">Nationality</label>
              <select
                id="nationality"
                name="nationality"
                value={form.nationality}
                onChange={handleChange}
                required
              >
                <option value="">Select your nationality</option>
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <label htmlFor="idType">Document Type</label>
                <select
                  id="idType"
                  name="idType"
                  value={form.idType}
                  onChange={handleChange}
                  required
                >
                  <option value="passport">Passport</option>
                  <option value="national_id">National ID</option>
                  <option value="driving_license">Driving License</option>
                </select>
              </div>

              <div className={styles.formField}>
                <label htmlFor="idNumber">Document Number</label>
                <input
                  id="idNumber"
                  type="text"
                  name="idNumber"
                  value={form.idNumber}
                  onChange={handleChange}
                  required
                  placeholder="Enter document number"
                />
              </div>
            </div>

            <div className={styles.infoCard}>
              <svg className={styles.infoIcon} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L4 7v6c0 4.52 3.13 8.75 8 9.88 4.87-1.13 8-5.36 8-9.88V7l-8-5z"/>
              </svg>
              <div>
                <strong>Your Data is Protected</strong>
                <p>Bank-grade encryption • GDPR compliant • Regulatory requirement</p>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className={styles.stepContent}>
            <div className={styles.stepHeader}>
              <div className={styles.stepIcon}>⬌</div>
              <h2 className={styles.stepTitle}>Contact Information</h2>
              <p className={styles.stepSubtitle}>Where we'll reach you</p>
            </div>
            
            <div className={styles.formField}>
              <label htmlFor="address">Street Address</label>
              <input
                id="address"
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                required
                placeholder="123 High Street, Apt 4B"
                autoComplete="street-address"
              />
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <label htmlFor="city">City</label>
                <input
                  id="city"
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  required
                  placeholder="London"
                  autoComplete="address-level2"
                />
              </div>

              <div className={styles.formField}>
                <label htmlFor="postalCode">Postal Code</label>
                <input
                  id="postalCode"
                  type="text"
                  name="postalCode"
                  value={form.postalCode}
                  onChange={handleChange}
                  required
                  placeholder="SW1A 1AA"
                  autoComplete="postal-code"
                />
              </div>
            </div>

            <div className={styles.formField}>
              <label htmlFor="country">Country</label>
              <select
                id="country"
                name="country"
                value={form.country}
                onChange={handleChange}
                required
              >
                <option value="">Select your country</option>
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            <div className={styles.formField}>
              <label htmlFor="phone">Mobile Phone</label>
              <input
                id="phone"
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                placeholder="+44 7700 900000"
                autoComplete="tel"
              />
              <small className={styles.fieldHint}>Include country code (e.g., +44 for UK)</small>
            </div>
          </div>
        );

      case 4:
        return (
          <div className={styles.stepContent}>
            <div className={styles.stepHeader}>
              <div className={styles.stepIcon}>▲</div>
              <h2 className={styles.stepTitle}>Financial Profile</h2>
              <p className={styles.stepSubtitle}>Final step to activate your account</p>
            </div>
            
            <div className={styles.formField}>
              <label htmlFor="employmentStatus">Employment Status</label>
              <select
                id="employmentStatus"
                name="employmentStatus"
                value={form.employmentStatus}
                onChange={handleChange}
                required
              >
                <option value="">Select employment status</option>
                {employmentOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className={styles.formField}>
              <label htmlFor="monthlyIncome">Monthly Income</label>
              <select
                id="monthlyIncome"
                name="monthlyIncome"
                value={form.monthlyIncome}
                onChange={handleChange}
                required
              >
                <option value="">Select income range</option>
                {incomeRanges.map(range => (
                  <option key={range} value={range}>{range}</option>
                ))}
              </select>
            </div>

            <div className={styles.formField}>
              <label htmlFor="purpose">Account Purpose</label>
              <select
                id="purpose"
                name="purpose"
                value={form.purpose}
                onChange={handleChange}
                required
              >
                <option value="">Select primary purpose</option>
                {accountPurposes.map(purpose => (
                  <option key={purpose} value={purpose}>{purpose}</option>
                ))}
              </select>
            </div>

            <div className={styles.agreements}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  name="terms"
                  checked={form.terms}
                  onChange={handleChange}
                  required
                />
                <span className={styles.checkmark}></span>
                <span className={styles.checkboxLabel}>
                  I accept the <a href="/terms" target="_blank">Terms & Conditions</a>
                </span>
              </label>

              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  name="privacy"
                  checked={form.privacy}
                  onChange={handleChange}
                  required
                />
                <span className={styles.checkmark}></span>
                <span className={styles.checkboxLabel}>
                  I accept the <a href="/privacy" target="_blank">Privacy Policy</a>
                </span>
              </label>

              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  name="marketing"
                  checked={form.marketing}
                  onChange={handleChange}
                />
                <span className={styles.checkmark}></span>
                <span className={styles.checkboxLabel}>
                  Send me updates and offers (optional)
                </span>
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.sidebar}>
          <div className={styles.sidebarContent}>
            <div className={styles.brand}>
              <svg className={styles.brandIcon} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L4 7v6c0 4.52 3.13 8.75 8 9.88 4.87-1.13 8-5.36 8-9.88V7l-8-5z"/>
              </svg>
              <div>
                <div className={styles.brandName}>ZentriBank</div>
                <div className={styles.brandTagline}>Private Banking</div>
              </div>
            </div>

            <div className={styles.features}>
              <div className={styles.feature}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L4 7v6c0 4.52 3.13 8.75 8 9.88 4.87-1.13 8-5.36 8-9.88V7l-8-5z"/>
                </svg>
                <div>
                  <strong>Bank-Grade Security</strong>
                  <p>256-bit encryption</p>
                </div>
              </div>

              <div className={styles.feature}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <div>
                  <strong>Instant Activation</strong>
                  <p>Account ready in minutes</p>
                </div>
              </div>

              <div className={styles.feature}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <div>
                  <strong>FDIC Insured</strong>
                  <p>Up to $250,000</p>
                </div>
              </div>
            </div>

            <div className={styles.progress}>
              <div className={styles.progressLabel}>
                Step {currentStep} of 4
              </div>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill}
                  style={{ width: `${(currentStep / 4) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.main}>
          {errorMsg && (
            <div className={styles.errorBanner}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            {renderStep()}
            
            <div className={styles.actions}>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className={styles.backButton}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="19" y1="12" x2="5" y2="12"/>
                    <polyline points="12 19 5 12 12 5"/>
                  </svg>
                  Back
                </button>
              )}
              
              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className={styles.nextButton}
                >
                  Continue
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading || !form.terms || !form.privacy}
                  className={styles.submitButton}
                >
                  {loading ? (
                    <>
                      <span className={styles.spinner}></span>
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>

          <div className={styles.footer}>
            <p>Already have an account?</p>
            <a href="/auth/signin" className={styles.signInLink}>
              Sign In →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}