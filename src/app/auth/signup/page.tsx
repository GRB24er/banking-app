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

  // Password strength calculator
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

  // Email validation with debounce
  useEffect(() => {
    const checkEmail = async () => {
      if (form.email.includes('@')) {
        // Simulate email check
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

    // Simulate API call
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
            <h2 className={styles.stepTitle}>Personal Information</h2>
            
            <div className={styles.formRow}>
              <div className={styles.formField}>
                <label htmlFor="firstName">First Name *</label>
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
                <label htmlFor="lastName">Last Name *</label>
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
              <label htmlFor="email">Email Address *</label>
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
              {emailExists && <span className={styles.fieldError}>Email already registered</span>}
            </div>

            <div className={styles.formField}>
              <label htmlFor="password">Password *</label>
              <div className={styles.passwordWrapper}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              
              {form.password && (
                <div className={styles.passwordStrength}>
                  <div className={styles.strengthBar}>
                    <div 
                      className={styles.strengthFill}
                      style={{ 
                        width: `${(passwordStrength / 5) * 100}%`,
                        backgroundColor: getPasswordStrengthColor()
                      }}
                    />
                  </div>
                  <span 
                    className={styles.strengthText}
                    style={{ color: getPasswordStrengthColor() }}
                  >
                    {getPasswordStrengthText()}
                  </span>
                </div>
              )}
              
              <div className={styles.passwordHints}>
                <small>Password must contain:</small>
                <ul>
                  <li className={form.password.length >= 8 ? styles.valid : ''}>8+ characters</li>
                  <li className={/[a-z]/.test(form.password) ? styles.valid : ''}>Lowercase letter</li>
                  <li className={/[A-Z]/.test(form.password) ? styles.valid : ''}>Uppercase letter</li>
                  <li className={/[0-9]/.test(form.password) ? styles.valid : ''}>Number</li>
                  <li className={/[^A-Za-z0-9]/.test(form.password) ? styles.valid : ''}>Special character</li>
                </ul>
              </div>
            </div>

            <div className={styles.formField}>
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm your password"
                autoComplete="new-password"
                className={form.confirmPassword && form.password !== form.confirmPassword ? styles.inputError : ''}
              />
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <span className={styles.fieldError}>Passwords do not match</span>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>Identity Verification</h2>
            
            <div className={styles.formField}>
              <label htmlFor="dob">Date of Birth *</label>
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
                <span className={styles.fieldError}>Must be 18 or older</span>
              )}
            </div>

            <div className={styles.formField}>
              <label htmlFor="nationality">Nationality *</label>
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

            <div className={styles.formRow}>
              <div className={styles.formField}>
                <label htmlFor="idType">ID Type *</label>
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
                <label htmlFor="idNumber">ID Number *</label>
                <input
                  id="idNumber"
                  type="text"
                  name="idNumber"
                  value={form.idNumber}
                  onChange={handleChange}
                  required
                  placeholder="Enter your ID number"
                />
              </div>
            </div>

            <div className={styles.securityNote}>
              <div className={styles.securityIcon}>🔒</div>
              <div>
                <strong>Your information is secure</strong>
                <p>We use bank-level encryption to protect your personal data. This information is required for regulatory compliance.</p>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>Address & Contact</h2>
            
            <div className={styles.formField}>
              <label htmlFor="address">Street Address *</label>
              <input
                id="address"
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                required
                placeholder="123 High Street, Apartment 4B"
                autoComplete="street-address"
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formField}>
                <label htmlFor="city">City *</label>
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
                <label htmlFor="postalCode">Postal Code *</label>
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
              <label htmlFor="country">Country *</label>
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
              <label htmlFor="phone">Mobile Phone *</label>
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
              <small className={styles.fieldHint}>Include country code (e.g., +44 for UK, +49 for Germany)</small>
            </div>
          </div>
        );

      case 4:
        return (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>Financial Information & Agreements</h2>
            
            <div className={styles.formField}>
              <label htmlFor="employmentStatus">Employment Status *</label>
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
              <label htmlFor="monthlyIncome">Monthly Income *</label>
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
              <label htmlFor="purpose">Account Purpose *</label>
              <select
                id="purpose"
                name="purpose"
                value={form.purpose}
                onChange={handleChange}
                required
              >
                <option value="">Select account purpose</option>
                {accountPurposes.map(purpose => (
                  <option key={purpose} value={purpose}>{purpose}</option>
                ))}
              </select>
            </div>

            <div className={styles.agreements}>
              <div className={styles.checkbox}>
                <input
                  type="checkbox"
                  id="terms"
                  name="terms"
                  checked={form.terms}
                  onChange={handleChange}
                  required
                />
                <label htmlFor="terms">
                  I agree to the <a href="/terms" target="_blank">Terms and Conditions</a> *
                </label>
              </div>

              <div className={styles.checkbox}>
                <input
                  type="checkbox"
                  id="privacy"
                  name="privacy"
                  checked={form.privacy}
                  onChange={handleChange}
                  required
                />
                <label htmlFor="privacy">
                  I agree to the <a href="/privacy" target="_blank">Privacy Policy</a> *
                </label>
              </div>

              <div className={styles.checkbox}>
                <input
                  type="checkbox"
                  id="marketing"
                  name="marketing"
                  checked={form.marketing}
                  onChange={handleChange}
                />
                <label htmlFor="marketing">
                  I agree to receive marketing communications (optional)
                </label>
              </div>
            </div>

            <div className={styles.regulatoryInfo}>
              <h3>Regulatory Information</h3>
              <p>
                By opening an account, you confirm that you are opening this account for yourself and not on behalf of a third party. 
                Horizon Global Capital is authorized and regulated by financial authorities in your jurisdiction.
              </p>
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
        <div className={styles.header}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>🏦</div>
            <span className={styles.logoText}>Horizon Global Capital</span>
          </div>
          
          <div className={styles.progressBar}>
            {[1, 2, 3, 4].map(step => (
              <div 
                key={step} 
                className={`${styles.progressStep} ${currentStep >= step ? styles.active : ''}`}
              >
                {currentStep > step ? '✓' : step}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.title}>
          <h1>Open Your Account</h1>
          <p>Join over 100,000 customers across Europe and Asia</p>
        </div>

        {errorMsg && <div className={styles.error}>{errorMsg}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          {renderStep()}
          
          <div className={styles.navigation}>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className={styles.backBtn}
              >
                ← Back
              </button>
            )}
            
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className={styles.nextBtn}
              >
                Continue →
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || !form.terms || !form.privacy}
                className={styles.submitBtn}
              >
                {loading ? (
                  <>
                    <span className={styles.spinner}></span>
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            )}
          </div>
        </form>

        <div className={styles.signInText}>
          Already have an account?{" "}
          <a href="/auth/signin" className={styles.signInLink}>
            Sign In
          </a>
        </div>

        <div className={styles.securityFooter}>
          <div className={styles.securityBadges}>
            <span>🔒 256-bit SSL</span>
            <span>🛡️ GDPR Compliant</span>
            <span>🏛️ Regulated Bank</span>
          </div>
        </div>
      </div>
    </div>
  );
}