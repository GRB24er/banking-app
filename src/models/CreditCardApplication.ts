// src/models/CreditCardApplication.ts
import mongoose from 'mongoose';

const creditCardApplicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applicationNumber: {
    type: String,
    unique: true,
    required: true
  },
  
  // Personal Information
  personalInfo: {
    firstName: String,
    lastName: String,
    middleName: String,
    dateOfBirth: Date,
    ssn: String, // Encrypted
    mothersMaidenName: String,
    
    // Contact
    email: String,
    phone: String,
    alternatePhone: String,
    
    // Address
    currentAddress: {
      street: String,
      apartment: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: 'USA' },
      yearsAtAddress: Number,
      monthsAtAddress: Number,
      residenceType: {
        type: String,
        enum: ['own', 'rent', 'live_with_parents', 'other']
      },
      monthlyPayment: Number
    },
    
    previousAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      yearsAtAddress: Number
    },
    
    // Identity
    identification: {
      type: { type: String, enum: ['passport', 'drivers_license', 'state_id'] },
      number: String,
      issueDate: Date,
      expiryDate: Date,
      issuingState: String
    }
  },
  
  // Employment Information
  employmentInfo: {
    status: {
      type: String,
      enum: ['employed', 'self_employed', 'unemployed', 'student', 'retired'],
      required: true
    },
    employer: String,
    jobTitle: String,
    yearsEmployed: Number,
    monthsEmployed: Number,
    workPhone: String,
    
    employerAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String
    },
    
    previousEmployer: String,
    previousJobTitle: String,
    yearsWithPreviousEmployer: Number,
    
    // Income
    annualIncome: Number,
    otherIncome: Number,
    otherIncomeSource: String,
    
    // For self-employed
    businessName: String,
    businessType: String,
    yearsInBusiness: Number
  },
  
  // Financial Information
  financialInfo: {
    monthlyRent: Number,
    monthlyMortgage: Number,
    
    bankAccounts: [{
      bankName: String,
      accountType: String,
      balance: Number
    }],
    
    investments: Number,
    
    // Existing Credit Cards
    existingCards: [{
      issuer: String,
      creditLimit: Number,
      currentBalance: Number
    }],
    
    // Loans
    loans: [{
      type: { type: String, enum: ['auto', 'student', 'personal', 'mortgage', 'other'] },
      lender: String,
      balance: Number,
      monthlyPayment: Number
    }],
    
    totalMonthlyDebtPayments: Number,
    
    // Financial History
    bankruptcy: Boolean,
    bankruptcyDate: Date,
    bankruptcyChapter: String,
    
    foreclosure: Boolean,
    foreclosureDate: Date,
    
    repossession: Boolean,
    repossessionDate: Date
  },
  
  // Card Preferences
  cardPreferences: {
    cardType: {
      type: String,
      enum: ['platinum', 'gold', 'silver', 'basic', 'student', 'secured', 'business'],
      default: 'basic'
    },
    requestedCreditLimit: Number,
    purposeOfCard: [String], // ['purchases', 'balance_transfer', 'cash_advance', 'building_credit']
    
    // For balance transfer
    balanceTransferAmount: Number,
    balanceTransferCards: [{
      issuer: String,
      accountNumber: String,
      balance: Number
    }],
    
    // Additional cardholders
    authorizedUsers: [{
      firstName: String,
      lastName: String,
      dateOfBirth: Date,
      relationship: String,
      ssn: String
    }]
  },
  
  // Documents
  documents: {
    identityProof: {
      fileName: String,
      uploadedAt: Date,
      verified: { type: Boolean, default: false },
      verifiedBy: String,
      verifiedAt: Date,
      notes: String
    },
    incomeProof: [{
      type: { type: String, enum: ['pay_stub', 'w2', 'tax_return', 'bank_statement'] },
      fileName: String,
      uploadedAt: Date,
      verified: { type: Boolean, default: false },
      verifiedBy: String,
      verifiedAt: Date
    }],
    addressProof: {
      fileName: String,
      uploadedAt: Date,
      verified: { type: Boolean, default: false },
      verifiedBy: String,
      verifiedAt: Date
    }
  },
  
  // Credit Check Results
  creditCheck: {
    provider: { type: String, enum: ['experian', 'equifax', 'transunion'] },
    checkedAt: Date,
    creditScore: Number,
    creditReport: {
      reportId: String,
      reportUrl: String
    },
    
    // Key factors
    paymentHistory: String,
    creditUtilization: Number,
    creditAge: Number,
    totalAccounts: Number,
    hardInquiries: Number,
    publicRecords: Number,
    
    // Risk assessment
    riskScore: Number,
    riskCategory: { type: String, enum: ['low', 'medium', 'high', 'very_high'] }
  },
  
  // Internal Scoring
  internalScoring: {
    scoreCalculatedAt: Date,
    
    // Scoring factors (0-100 each)
    creditScoreFactor: Number,
    incomeStabilityFactor: Number,
    debtToIncomeRatio: Number,
    employmentStabilityFactor: Number,
    residentialStabilityFactor: Number,
    bankingRelationshipFactor: Number,
    
    // Final scores
    totalScore: Number,
    creditLimit: Number,
    interestRate: Number,
    
    // Recommendations
    recommendedAction: {
      type: String,
      enum: ['approve', 'decline', 'manual_review', 'request_more_info']
    },
    recommendationReason: String
  },
  
  // Application Status
  status: {
    type: String,
    enum: [
      'draft',
      'submitted',
      'documents_pending',
      'under_review',
      'credit_check_pending',
      'credit_check_completed',
      'manual_review',
      'approved',
      'declined',
      'withdrawn',
      'expired'
    ],
    default: 'draft'
  },
  
  // Workflow
  workflow: {
    submittedAt: Date,
    lastUpdatedAt: Date,
    
    // Review process
    assignedTo: String,
    assignedAt: Date,
    
    reviewNotes: [{
      note: String,
      addedBy: String,
      addedAt: Date,
      type: { type: String, enum: ['info', 'warning', 'action_required'] }
    }],
    
    // Approval/Decline
    decision: {
      type: { type: String, enum: ['approved', 'declined'] },
      madeBy: String,
      madeAt: Date,
      reason: String,
      conditions: [String]
    },
    
    // For approved applications
    approval: {
      creditLimit: Number,
      interestRate: Number,
      annualFee: Number,
      
      cardDetails: {
        cardType: String,
        cardNumber: String, // Encrypted
        expiryDate: Date,
        cvv: String, // Encrypted
        pin: String, // Encrypted
        
        activatedAt: Date,
        isActive: { type: Boolean, default: false }
      },
      
      termsAccepted: Boolean,
      termsAcceptedAt: Date,
      
      cardShipped: Boolean,
      cardShippedAt: Date,
      trackingNumber: String,
      
      cardDelivered: Boolean,
      cardDeliveredAt: Date
    }
  },
  
  // Compliance & Legal
  compliance: {
    consentToCreditCheck: Boolean,
    consentDate: Date,
    
    disclosuresProvided: {
      schumerBox: Boolean,
      termsAndConditions: Boolean,
      privacyPolicy: Boolean,
      electronicConsent: Boolean
    },
    
    patriotActCompliance: {
      identityVerified: Boolean,
      ofacChecked: Boolean,
      ofacClearDate: Date
    },
    
    ipAddress: String,
    userAgent: String,
    
    signature: String,
    signatureDate: Date
  },
  
  // Notifications sent
  notifications: [{
    type: String,
    sentAt: Date,
    sentTo: String,
    method: { type: String, enum: ['email', 'sms', 'mail'] },
    status: String
  }],
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  expiresAt: Date // Application expires after 30 days if not completed
});

export default mongoose.model('CreditCardApplication', creditCardApplicationSchema);