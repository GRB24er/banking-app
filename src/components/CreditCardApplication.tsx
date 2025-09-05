// src/components/CreditCardApplication.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ApplicationData {
  personal: any;
  employment: any;
  financial: any;
  preferences: any;
  consent: any;
}

export default function CreditCardApplicationForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [applicationId, setApplicationId] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  
  const [formData, setFormData] = useState<ApplicationData>({
    personal: {
      firstName: '',
      lastName: '',
      middleName: '',
      dateOfBirth: '',
      ssn: '',
      mothersMaidenName: '',
      phone: '',
      alternatePhone: '',
      currentAddress: {
        street: '',
        apartment: '',
        city: '',
        state: '',
        zipCode: '',
        yearsAtAddress: 0,
        monthsAtAddress: 0,
        residenceType: 'rent',
        monthlyPayment: 0
      },
      identification: {
        type: 'drivers_license',
        number: '',
        issueDate: '',
        expiryDate: '',
        issuingState: ''
      }
    },
    employment: {
      status: 'employed',
      employer: '',
      jobTitle: '',
      yearsEmployed: 0,
      monthsEmployed: 0,
      workPhone: '',
      annualIncome: 0,
      otherIncome: 0,
      otherIncomeSource: ''
    },
    financial: {
      monthlyRent: 0,
      monthlyMortgage: 0,
      existingCards: [],
      loans: [],
      totalMonthlyDebtPayments: 0,
      bankruptcy: false,
      bankruptcyDate: '',
      foreclosure: false,
      repossession: false
    },
    preferences: {
      cardType: 'basic',
      requestedCreditLimit: 5000,
      purposeOfCard: ['purchases'],
      balanceTransferAmount: 0
    },
    consent: {
      consentToCreditCheck: false,
      disclosuresProvided: {
        schumerBox: false,
        termsAndConditions: false,
        privacyPolicy: false,
        electronicConsent: false
      }
    }
  });

  const steps = [
    { number: 1, title: 'Personal Information', key: 'personal' },
    { number: 2, title: 'Employment', key: 'employment' },
    { number: 3, title: 'Financial Information', key: 'financial' },
    { number: 4, title: 'Card Preferences', key: 'preferences' },
    { number: 5, title: 'Review & Consent', key: 'consent' }
  ];

  const cardTypes = [
    { 
      value: 'platinum', 
      name: 'Platinum Card', 
      minIncome: 75000,
      annualFee: 495,
      benefits: '3% cashback, airport lounge access, travel insurance'
    },
    { 
      value: 'gold', 
      name: 'Gold Card', 
      minIncome: 50000,
      annualFee: 295,
      benefits: '2% cashback on dining and travel'
    },
    { 
      value: 'silver', 
      name: 'Silver Card', 
      minIncome: 35000,
      annualFee: 95,
      benefits: '1.5% cashback on all purchases'
    },
    { 
      value: 'basic', 
      name: 'Basic Card', 
      minIncome: 20000,
      annualFee: 0,
      benefits: '1% cashback, no annual fee'
    },
    { 
      value: 'student', 
      name: 'Student Card', 
      minIncome: 0,
      annualFee: 0,
      benefits: 'Build credit, 1% cashback, 2% on textbooks'
    },
    { 
      value: 'secured', 
      name: 'Secured Card', 
      minIncome: 15000,
      annualFee: 39,
      benefits: 'Build/rebuild credit with security deposit'
    }
  ];

  const handleInputChange = (step: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [step]: {
        ...prev[step as keyof ApplicationData],
        [field]: value
      }
    }));
  };

  const handleNestedInputChange = (step: string, parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [step]: {
        ...prev[step as keyof ApplicationData],
        [parent]: {
          ...prev[step as keyof ApplicationData][parent],
          [field]: value
        }
      }
    }));
  };

  const validateStep = (step: number): boolean => {
    switch(step) {
      case 1:
        if (!formData.personal.firstName || !formData.personal.lastName) {
          setError('Please enter your full name');
          return false;
        }
        if (!formData.personal.dateOfBirth) {
          setError('Please enter your date of birth');
          return false;
        }
        if (!formData.personal.ssn || formData.personal.ssn.length !== 9) {
          setError('Please enter a valid SSN');
          return false;
        }
        break;
      case 2:
        if (!formData.employment.annualIncome || formData.employment.annualIncome < 10000) {
          setError('Please enter a valid annual income');
          return false;
        }
        break;
      case 5:
        if (!formData.consent.consentToCreditCheck) {
          setError('You must consent to a credit check to proceed');
          return false;
        }
        break;
    }
    setError('');
    return true;
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);
    setError('');

    try {
      // Save current step data
      const stepKey = steps[currentStep - 1].key;
      const response = await fetch('/api/credit-card/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: stepKey,
          data: formData[stepKey as keyof ApplicationData]
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save application');
      }

      setApplicationId(result.applicationId);

      if (currentStep === 5) {
        // Final submission - request OTP
        setShowOtpModal(true);
        await requestOtp();
      } else {
        setCurrentStep(currentStep + 1);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const requestOtp = async () => {
    try {
      const response = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'card_application'
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send OTP');
      }

      setSuccess('Verification code sent to your email');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const submitApplication = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Verify OTP
      const verifyResponse = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: otpCode,
          action: 'card_application'
        })
      });

      if (!verifyResponse.ok) {
        const verifyResult = await verifyResponse.json();
        throw new Error(verifyResult.error || 'Invalid verification code');
      }

      // Submit application
      const submitResponse = await fetch('/api/credit-card/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'submit',
          data: { applicationId }
        })
      });

      const submitResult = await submitResponse.json();

      if (!submitResponse.ok) {
        throw new Error(submitResult.error || 'Failed to submit application');
      }

      setSuccess('Application submitted successfully! We will review your application and notify you within 2-3 business days.');
      
      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="credit-card-application">
      {/* Progress Bar */}
      <div className="progress-bar">
        {steps.map((step, index) => (
          <div 
            key={step.number}
            className={`progress-step ${currentStep > step.number ? 'completed' : ''} ${currentStep === step.number ? 'active' : ''}`}
          >
            <div className="step-number">{step.number}</div>
            <div className="step-title">{step.title}</div>
          </div>
        ))}
      </div>

      {/* Form Content */}
      <div className="form-content">
        {error && (
          <div className="alert alert-error">{error}</div>
        )}

        {success && (
          <div className="alert alert-success">{success}</div>
        )}

        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <div className="step-content">
            <h2>Personal Information</h2>
            
            <div className="form-grid">
              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  value={formData.personal.firstName}
                  onChange={(e) => handleInputChange('personal', 'firstName', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  value={formData.personal.lastName}
                  onChange={(e) => handleInputChange('personal', 'lastName', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Date of Birth *</label>
                <input
                  type="date"
                  value={formData.personal.dateOfBirth}
                  onChange={(e) => handleInputChange('personal', 'dateOfBirth', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Social Security Number *</label>
                <input
                  type="text"
                  value={formData.personal.ssn}
                  onChange={(e) => handleInputChange('personal', 'ssn', e.target.value.replace(/\D/g, ''))}
                  maxLength={9}
                  placeholder="123456789"
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  value={formData.personal.phone}
                  onChange={(e) => handleInputChange('personal', 'phone', e.target.value)}
                  required
                />
              </div>

              <div className="form-group full-width">
                <label>Street Address *</label>
                <input
                  type="text"
                  value={formData.personal.currentAddress.street}
                  onChange={(e) => handleNestedInputChange('personal', 'currentAddress', 'street', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>City *</label>
                <input
                  type="text"
                  value={formData.personal.currentAddress.city}
                  onChange={(e) => handleNestedInputChange('personal', 'currentAddress', 'city', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>State *</label>
                <input
                  type="text"
                  value={formData.personal.currentAddress.state}
                  onChange={(e) => handleNestedInputChange('personal', 'currentAddress', 'state', e.target.value)}
                  maxLength={2}
                  required
                />
              </div>

              <div className="form-group">
                <label>ZIP Code *</label>
                <input
                  type="text"
                  value={formData.personal.currentAddress.zipCode}
                  onChange={(e) => handleNestedInputChange('personal', 'currentAddress', 'zipCode', e.target.value)}
                  maxLength={5}
                  required
                />
              </div>

              <div className="form-group">
                <label>Residence Type *</label>
                <select
                  value={formData.personal.currentAddress.residenceType}
                  onChange={(e) => handleNestedInputChange('personal', 'currentAddress', 'residenceType', e.target.value)}
                >
                  <option value="own">Own</option>
                  <option value="rent">Rent</option>
                  <option value="live_with_parents">Live with Parents</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Employment */}
        {currentStep === 2 && (
          <div className="step-content">
            <h2>Employment Information</h2>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Employment Status *</label>
                <select
                  value={formData.employment.status}
                  onChange={(e) => handleInputChange('employment', 'status', e.target.value)}
                >
                  <option value="employed">Employed</option>
                  <option value="self_employed">Self Employed</option>
                  <option value="unemployed">Unemployed</option>
                  <option value="student">Student</option>
                  <option value="retired">Retired</option>
                </select>
              </div>

              {(formData.employment.status === 'employed' || formData.employment.status === 'self_employed') && (
                <>
                  <div className="form-group">
                    <label>Employer Name</label>
                    <input
                      type="text"
                      value={formData.employment.employer}
                      onChange={(e) => handleInputChange('employment', 'employer', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Job Title</label>
                    <input
                      type="text"
                      value={formData.employment.jobTitle}
                      onChange={(e) => handleInputChange('employment', 'jobTitle', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Years Employed</label>
                    <input
                      type="number"
                      value={formData.employment.yearsEmployed}
                      onChange={(e) => handleInputChange('employment', 'yearsEmployed', parseInt(e.target.value) || 0)}
                      min="0"
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label>Annual Income *</label>
                <input
                  type="number"
                  value={formData.employment.annualIncome}
                  onChange={(e) => handleInputChange('employment', 'annualIncome', parseInt(e.target.value) || 0)}
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label>Other Income</label>
                <input
                  type="number"
                  value={formData.employment.otherIncome}
                  onChange={(e) => handleInputChange('employment', 'otherIncome', parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>

              {formData.employment.otherIncome > 0 && (
                <div className="form-group">
                  <label>Source of Other Income</label>
                  <input
                    type="text"
                    value={formData.employment.otherIncomeSource}
                    onChange={(e) => handleInputChange('employment', 'otherIncomeSource', e.target.value)}
                    placeholder="e.g., Investments, Rental Income"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="form-navigation">
          {currentStep > 1 && (
            <button
              className="btn btn-secondary"
              onClick={() => setCurrentStep(currentStep - 1)}
              disabled={loading}
            >
              Previous
            </button>
          )}
          
          <button
            className="btn btn-primary"
            onClick={handleNext}
            disabled={loading}
          >
            {loading ? 'Processing...' : currentStep === 5 ? 'Submit Application' : 'Next'}
          </button>
        </div>
      </div>

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Verify Your Application</h3>
            <p>Please enter the 6-digit verification code sent to your email</p>
            
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              maxLength={6}
              placeholder="000000"
              className="otp-input"
            />
            
            <div className="modal-actions">
              <button onClick={() => setShowOtpModal(false)}>Cancel</button>
              <button onClick={submitApplication} disabled={loading}>
                {loading ? 'Verifying...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}