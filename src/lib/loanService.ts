// src/lib/loanService.ts
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import { notifyAdmin } from '@/lib/adminNotifications';
import mail from '@/lib/mail';

// ============================================
// LOAN APPLICATION MODEL
// ============================================
const LoanApplicationSchema = new mongoose.Schema({
  
  // Applicant Info
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  userEmail: { type: String, required: true },
  userName: { type: String, required: true },
  
  // Loan Details
  loanType: { 
    type: String, 
    enum: [
      'personal',
      'business',
      'mortgage',
      'auto',
      'education',
      'medical',
      'debt_consolidation',
      'home_improvement',
      'vacation',
      'emergency'
    ],
    required: true 
  },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  term: { type: Number, required: true }, // in months
  purpose: { type: String, required: true },
  
  // Calculated Fields
  interestRate: { type: Number }, // Annual percentage
  monthlyPayment: { type: Number },
  totalRepayment: { type: Number },
  totalInterest: { type: Number },
  
  // Employment & Income
  employmentStatus: { 
    type: String, 
    enum: ['employed', 'self_employed', 'unemployed', 'retired', 'student'],
    required: true 
  },
  employerName: { type: String },
  jobTitle: { type: String },
  monthlyIncome: { type: Number, required: true },
  additionalIncome: { type: Number, default: 0 },
  incomeSource: { type: String },
  
  // Financial Info
  existingDebts: { type: Number, default: 0 },
  monthlyExpenses: { type: Number },
  creditScore: { type: Number },
  bankruptcyHistory: { type: Boolean, default: false },
  
  // Collateral (for secured loans)
  isSecured: { type: Boolean, default: false },
  collateralType: { type: String },
  collateralValue: { type: Number },
  collateralDescription: { type: String },
  
  // Documents
  documents: [{
    type: { type: String }, // 'id', 'income_proof', 'bank_statement', 'collateral_proof'
    fileName: { type: String },
    fileUrl: { type: String },
    uploadedAt: { type: Date, default: Date.now },
  }],
  
  // Application Status
  status: { 
    type: String, 
    enum: [
      'draft',
      'submitted',
      'under_review',
      'documents_required',
      'approved',
      'rejected',
      'disbursed',
      'closed',
      'defaulted'
    ],
    default: 'draft',
    index: true
  },
  
  // Admin Review
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  reviewNotes: { type: String },
  rejectionReason: { type: String },
  
  // Approval Details
  approvedAmount: { type: Number },
  approvedRate: { type: Number },
  approvedTerm: { type: Number },
  conditions: [{ type: String }],
  
  // Disbursement
  disbursedAt: { type: Date },
  disbursedAmount: { type: Number },
  disbursementAccount: { type: String },
  disbursementReference: { type: String },
  
  // Repayment Tracking
  nextPaymentDate: { type: Date },
  lastPaymentDate: { type: Date },
  totalPaid: { type: Number, default: 0 },
  remainingBalance: { type: Number },
  missedPayments: { type: Number, default: 0 },
  
  // Metadata
  applicationNumber: { type: String, unique: true },
  ipAddress: { type: String },
  userAgent: { type: String },
  submittedAt: { type: Date },
  
}, { timestamps: true });

// Generate application number
LoanApplicationSchema.pre('save', async function(next) {
  if (!this.applicationNumber) {
    const count = await mongoose.models.LoanApplication.countDocuments();
    const year = new Date().getFullYear();
    this.applicationNumber = `HGC-LOAN-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

const LoanApplication = mongoose.models.LoanApplication || mongoose.model('LoanApplication', LoanApplicationSchema);

// ============================================
// LOAN TYPES CONFIGURATION
// ============================================
export const LOAN_TYPES = {
  personal: {
    name: 'Personal Loan',
    description: 'General purpose personal financing',
    minAmount: 1000,
    maxAmount: 50000,
    minTerm: 6,
    maxTerm: 60,
    baseRate: 8.99,
    maxRate: 24.99,
    requiresCollateral: false,
  },
  business: {
    name: 'Business Loan',
    description: 'Financing for business operations and expansion',
    minAmount: 5000,
    maxAmount: 500000,
    minTerm: 12,
    maxTerm: 84,
    baseRate: 6.99,
    maxRate: 18.99,
    requiresCollateral: true,
  },
  mortgage: {
    name: 'Mortgage Loan',
    description: 'Home purchase or refinancing',
    minAmount: 50000,
    maxAmount: 2000000,
    minTerm: 60,
    maxTerm: 360,
    baseRate: 4.99,
    maxRate: 8.99,
    requiresCollateral: true,
  },
  auto: {
    name: 'Auto Loan',
    description: 'Vehicle purchase financing',
    minAmount: 5000,
    maxAmount: 100000,
    minTerm: 12,
    maxTerm: 84,
    baseRate: 5.49,
    maxRate: 15.99,
    requiresCollateral: true,
  },
  education: {
    name: 'Education Loan',
    description: 'Tuition and education expenses',
    minAmount: 1000,
    maxAmount: 150000,
    minTerm: 12,
    maxTerm: 180,
    baseRate: 4.49,
    maxRate: 12.99,
    requiresCollateral: false,
  },
  medical: {
    name: 'Medical Loan',
    description: 'Healthcare and medical expenses',
    minAmount: 500,
    maxAmount: 100000,
    minTerm: 6,
    maxTerm: 84,
    baseRate: 6.99,
    maxRate: 19.99,
    requiresCollateral: false,
  },
  debt_consolidation: {
    name: 'Debt Consolidation',
    description: 'Combine multiple debts into one payment',
    minAmount: 5000,
    maxAmount: 100000,
    minTerm: 12,
    maxTerm: 60,
    baseRate: 7.99,
    maxRate: 21.99,
    requiresCollateral: false,
  },
  home_improvement: {
    name: 'Home Improvement Loan',
    description: 'Home renovation and repairs',
    minAmount: 2500,
    maxAmount: 100000,
    minTerm: 12,
    maxTerm: 84,
    baseRate: 6.49,
    maxRate: 16.99,
    requiresCollateral: false,
  },
  vacation: {
    name: 'Vacation Loan',
    description: 'Travel and vacation financing',
    minAmount: 1000,
    maxAmount: 25000,
    minTerm: 6,
    maxTerm: 36,
    baseRate: 9.99,
    maxRate: 24.99,
    requiresCollateral: false,
  },
  emergency: {
    name: 'Emergency Loan',
    description: 'Urgent financial needs',
    minAmount: 500,
    maxAmount: 15000,
    minTerm: 3,
    maxTerm: 24,
    baseRate: 11.99,
    maxRate: 29.99,
    requiresCollateral: false,
  },
};

// ============================================
// CALCULATE LOAN DETAILS
// ============================================
export function calculateLoanDetails(
  amount: number,
  annualRate: number,
  termMonths: number
): {
  monthlyPayment: number;
  totalRepayment: number;
  totalInterest: number;
} {
  const monthlyRate = annualRate / 100 / 12;
  
  if (monthlyRate === 0) {
    const monthlyPayment = amount / termMonths;
    return {
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalRepayment: amount,
      totalInterest: 0,
    };
  }
  
  const monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                         (Math.pow(1 + monthlyRate, termMonths) - 1);
  
  const totalRepayment = monthlyPayment * termMonths;
  const totalInterest = totalRepayment - amount;
  
  return {
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalRepayment: Math.round(totalRepayment * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
  };
}

// ============================================
// DETERMINE INTEREST RATE
// ============================================
export function determineInterestRate(
  loanType: keyof typeof LOAN_TYPES,
  creditScore: number = 700,
  employmentStatus: string,
  amount: number,
  monthlyIncome: number
): number {
  const config = LOAN_TYPES[loanType];
  let rate = config.baseRate;
  
  // Credit score adjustment
  if (creditScore >= 800) rate -= 1.5;
  else if (creditScore >= 750) rate -= 1.0;
  else if (creditScore >= 700) rate -= 0.5;
  else if (creditScore >= 650) rate += 1.0;
  else if (creditScore >= 600) rate += 3.0;
  else rate += 5.0;
  
  // Employment adjustment
  if (employmentStatus === 'employed') rate -= 0.5;
  else if (employmentStatus === 'self_employed') rate += 0.5;
  else if (employmentStatus === 'unemployed') rate += 4.0;
  else if (employmentStatus === 'retired') rate += 0.25;
  
  // Debt-to-income ratio
  const dti = (amount / 12) / monthlyIncome;
  if (dti > 0.5) rate += 2.0;
  else if (dti > 0.4) rate += 1.0;
  else if (dti > 0.3) rate += 0.5;
  
  // Ensure within bounds
  rate = Math.max(config.baseRate, Math.min(config.maxRate, rate));
  
  return Math.round(rate * 100) / 100;
}

// ============================================
// CREATE LOAN APPLICATION
// ============================================
export async function createLoanApplication(
  userId: string,
  userEmail: string,
  userName: string,
  data: {
    loanType: keyof typeof LOAN_TYPES;
    amount: number;
    term: number;
    purpose: string;
    employmentStatus: string;
    employerName?: string;
    jobTitle?: string;
    monthlyIncome: number;
    additionalIncome?: number;
    existingDebts?: number;
    monthlyExpenses?: number;
    creditScore?: number;
    isSecured?: boolean;
    collateralType?: string;
    collateralValue?: number;
    collateralDescription?: string;
  },
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; application?: any; error?: string }> {
  try {
    await connectDB();
    
    const config = LOAN_TYPES[data.loanType];
    
    // Validate amount
    if (data.amount < config.minAmount || data.amount > config.maxAmount) {
      return { 
        success: false, 
        error: `Amount must be between ${config.minAmount} and ${config.maxAmount}` 
      };
    }
    
    // Validate term
    if (data.term < config.minTerm || data.term > config.maxTerm) {
      return { 
        success: false, 
        error: `Term must be between ${config.minTerm} and ${config.maxTerm} months` 
      };
    }
    
    // Calculate interest rate
    const interestRate = determineInterestRate(
      data.loanType,
      data.creditScore,
      data.employmentStatus,
      data.amount,
      data.monthlyIncome
    );
    
    // Calculate loan details
    const loanDetails = calculateLoanDetails(data.amount, interestRate, data.term);
    
    // Create application
    const application = await LoanApplication.create({
      userId,
      userEmail,
      userName,
      ...data,
      interestRate,
      ...loanDetails,
      status: 'submitted',
      submittedAt: new Date(),
      ipAddress,
      userAgent,
    });
    
    // Notify admin
    await notifyAdmin({
      type: 'incoming_transfer', // Using existing type, could add 'loan_application'
      userId,
      userEmail,
      userName,
      amount: data.amount,
      currency: 'USD',
      description: `New ${config.name} Application`,
      metadata: {
        applicationNumber: application.applicationNumber,
        loanType: data.loanType,
        term: `${data.term} months`,
        interestRate: `${interestRate}%`,
        monthlyPayment: loanDetails.monthlyPayment,
      },
    });
    
    // Send confirmation email to user
    await sendLoanApplicationEmail(userEmail, userName, application);
    
    return { success: true, application };
    
  } catch (error: any) {
    console.error('[Loan] Create application error:', error);
    return { success: false, error: error.message || 'Failed to create application' };
  }
}

// ============================================
// GET USER LOAN APPLICATIONS
// ============================================
export async function getUserLoanApplications(userId: string): Promise<any[]> {
  await connectDB();
  return LoanApplication.find({ userId }).sort({ createdAt: -1 });
}

// ============================================
// GET LOAN APPLICATION BY ID
// ============================================
export async function getLoanApplication(applicationId: string, userId?: string): Promise<any> {
  await connectDB();
  const query: any = { _id: applicationId };
  if (userId) query.userId = userId;
  return LoanApplication.findOne(query);
}

// ============================================
// GET ALL APPLICATIONS (ADMIN)
// ============================================
export async function getAllLoanApplications(
  filters?: {
    status?: string;
    loanType?: string;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<any[]> {
  await connectDB();
  
  const query: any = {};
  
  if (filters?.status) query.status = filters.status;
  if (filters?.loanType) query.loanType = filters.loanType;
  if (filters?.startDate || filters?.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = filters.startDate;
    if (filters.endDate) query.createdAt.$lte = filters.endDate;
  }
  
  return LoanApplication.find(query).sort({ createdAt: -1 });
}

// ============================================
// APPROVE LOAN (ADMIN)
// ============================================
export async function approveLoan(
  applicationId: string,
  adminId: string,
  approvalData: {
    approvedAmount: number;
    approvedRate: number;
    approvedTerm: number;
    conditions?: string[];
    reviewNotes?: string;
  }
): Promise<{ success: boolean; application?: any; error?: string }> {
  try {
    await connectDB();
    
    const application = await LoanApplication.findById(applicationId);
    
    if (!application) {
      return { success: false, error: 'Application not found' };
    }
    
    if (application.status !== 'submitted' && application.status !== 'under_review') {
      return { success: false, error: 'Application cannot be approved in current status' };
    }
    
    // Calculate new loan details based on approved terms
    const loanDetails = calculateLoanDetails(
      approvalData.approvedAmount,
      approvalData.approvedRate,
      approvalData.approvedTerm
    );
    
    application.status = 'approved';
    application.reviewedBy = adminId;
    application.reviewedAt = new Date();
    application.approvedAmount = approvalData.approvedAmount;
    application.approvedRate = approvalData.approvedRate;
    application.approvedTerm = approvalData.approvedTerm;
    application.monthlyPayment = loanDetails.monthlyPayment;
    application.totalRepayment = loanDetails.totalRepayment;
    application.totalInterest = loanDetails.totalInterest;
    application.conditions = approvalData.conditions || [];
    application.reviewNotes = approvalData.reviewNotes;
    
    await application.save();
    
    // Send approval email
    await sendLoanApprovalEmail(application);
    
    return { success: true, application };
    
  } catch (error: any) {
    console.error('[Loan] Approve error:', error);
    return { success: false, error: error.message || 'Failed to approve loan' };
  }
}

// ============================================
// REJECT LOAN (ADMIN)
// ============================================
export async function rejectLoan(
  applicationId: string,
  adminId: string,
  rejectionReason: string,
  reviewNotes?: string
): Promise<{ success: boolean; application?: any; error?: string }> {
  try {
    await connectDB();
    
    const application = await LoanApplication.findById(applicationId);
    
    if (!application) {
      return { success: false, error: 'Application not found' };
    }
    
    application.status = 'rejected';
    application.reviewedBy = adminId;
    application.reviewedAt = new Date();
    application.rejectionReason = rejectionReason;
    application.reviewNotes = reviewNotes;
    
    await application.save();
    
    // Send rejection email
    await sendLoanRejectionEmail(application);
    
    return { success: true, application };
    
  } catch (error: any) {
    console.error('[Loan] Reject error:', error);
    return { success: false, error: error.message || 'Failed to reject loan' };
  }
}

// ============================================
// DISBURSE LOAN (ADMIN)
// ============================================
export async function disburseLoan(
  applicationId: string,
  adminId: string,
  disbursementData: {
    disbursementAccount: string;
    disbursementReference: string;
  }
): Promise<{ success: boolean; application?: any; error?: string }> {
  try {
    await connectDB();
    
    const application = await LoanApplication.findById(applicationId);
    
    if (!application) {
      return { success: false, error: 'Application not found' };
    }
    
    if (application.status !== 'approved') {
      return { success: false, error: 'Only approved loans can be disbursed' };
    }
    
    // Calculate first payment date (30 days from now)
    const nextPaymentDate = new Date();
    nextPaymentDate.setDate(nextPaymentDate.getDate() + 30);
    
    application.status = 'disbursed';
    application.disbursedAt = new Date();
    application.disbursedAmount = application.approvedAmount;
    application.disbursementAccount = disbursementData.disbursementAccount;
    application.disbursementReference = disbursementData.disbursementReference;
    application.remainingBalance = application.totalRepayment;
    application.nextPaymentDate = nextPaymentDate;
    
    await application.save();
    
    // Send disbursement email
    await sendLoanDisbursementEmail(application);
    
    return { success: true, application };
    
  } catch (error: any) {
    console.error('[Loan] Disburse error:', error);
    return { success: false, error: error.message || 'Failed to disburse loan' };
  }
}

// ============================================
// REQUEST DOCUMENTS (ADMIN)
// ============================================
export async function requestDocuments(
  applicationId: string,
  adminId: string,
  requiredDocuments: string[],
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await connectDB();
    
    const application = await LoanApplication.findById(applicationId);
    
    if (!application) {
      return { success: false, error: 'Application not found' };
    }
    
    application.status = 'documents_required';
    application.reviewNotes = notes;
    
    await application.save();
    
    // Send documents request email
    await sendDocumentsRequestEmail(application, requiredDocuments);
    
    return { success: true };
    
  } catch (error: any) {
    console.error('[Loan] Request documents error:', error);
    return { success: false, error: error.message || 'Failed to request documents' };
  }
}

// ============================================
// EMAIL TEMPLATES
// ============================================
async function sendLoanApplicationEmail(email: string, name: string, application: any): Promise<void> {
  const config = LOAN_TYPES[application.loanType as keyof typeof LOAN_TYPES];
  
  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#0f172a 100%);padding:32px;text-align:center;">
              <span style="font-size:28px;font-weight:800;color:#D4AF37;">HORIZON</span>
              <div style="font-size:11px;color:#94a3b8;letter-spacing:2px;margin-top:4px;">GLOBAL CAPITAL</div>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <div style="text-align:center;margin-bottom:32px;">
                <div style="width:80px;height:80px;background:#10b98120;border-radius:50%;margin:0 auto 16px;line-height:80px;font-size:36px;">📋</div>
                <h1 style="margin:0;font-size:24px;color:#1e293b;">Loan Application Received</h1>
              </div>
              
              <p style="font-size:16px;color:#475569;line-height:1.6;">Dear ${name},</p>
              <p style="font-size:16px;color:#475569;line-height:1.6;">
                Thank you for your ${config.name} application. We have received your application and it is now under review.
              </p>
              
              <div style="background:#f8fafc;border-radius:12px;padding:24px;margin:24px 0;">
                <h3 style="margin:0 0 16px;font-size:14px;color:#64748b;text-transform:uppercase;">Application Details</h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:8px 0;color:#64748b;">Application Number:</td>
                    <td style="padding:8px 0;text-align:right;color:#1e293b;font-weight:600;font-family:monospace;">${application.applicationNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#64748b;">Loan Type:</td>
                    <td style="padding:8px 0;text-align:right;color:#1e293b;font-weight:600;">${config.name}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#64748b;">Requested Amount:</td>
                    <td style="padding:8px 0;text-align:right;color:#1e293b;font-weight:600;">$${application.amount.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#64748b;">Term:</td>
                    <td style="padding:8px 0;text-align:right;color:#1e293b;font-weight:600;">${application.term} months</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#64748b;">Estimated Rate:</td>
                    <td style="padding:8px 0;text-align:right;color:#1e293b;font-weight:600;">${application.interestRate}% APR</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#64748b;">Est. Monthly Payment:</td>
                    <td style="padding:8px 0;text-align:right;color:#10b981;font-weight:700;font-size:18px;">$${application.monthlyPayment.toLocaleString()}</td>
                  </tr>
                </table>
              </div>
              
              <div style="background:#fef3c7;border-radius:8px;padding:16px;margin:24px 0;">
                <p style="margin:0;font-size:14px;color:#b45309;">
                  ⏱ <strong>Next Steps:</strong> Our team will review your application within 1-2 business days. You may be contacted for additional documentation.
                </p>
              </div>
              
              <p style="font-size:14px;color:#64748b;line-height:1.6;">
                If you have any questions, please contact our support team.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;padding:24px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#64748b;">© ${new Date().getFullYear()} Horizon Global Capital Ltd.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await (mail as any).sendEmail({
    to: email,
    subject: `Loan Application Received - ${application.applicationNumber}`,
    html,
  });
}

async function sendLoanApprovalEmail(application: any): Promise<void> {
  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#0f172a 100%);padding:32px;text-align:center;">
              <span style="font-size:28px;font-weight:800;color:#D4AF37;">HORIZON</span>
              <div style="font-size:11px;color:#94a3b8;letter-spacing:2px;margin-top:4px;">GLOBAL CAPITAL</div>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <div style="text-align:center;margin-bottom:32px;">
                <div style="width:80px;height:80px;background:#10b98120;border-radius:50%;margin:0 auto 16px;line-height:80px;font-size:36px;">✅</div>
                <h1 style="margin:0;font-size:24px;color:#10b981;">Loan Approved!</h1>
              </div>
              
              <p style="font-size:16px;color:#475569;line-height:1.6;">Dear ${application.userName},</p>
              <p style="font-size:16px;color:#475569;line-height:1.6;">
                Congratulations! Your loan application has been approved.
              </p>
              
              <div style="background:#10b98110;border:1px solid #10b98130;border-radius:12px;padding:24px;margin:24px 0;">
                <h3 style="margin:0 0 16px;font-size:14px;color:#10b981;text-transform:uppercase;">Approved Loan Terms</h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:8px 0;color:#475569;">Approved Amount:</td>
                    <td style="padding:8px 0;text-align:right;color:#1e293b;font-weight:700;font-size:20px;">$${application.approvedAmount.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#475569;">Interest Rate:</td>
                    <td style="padding:8px 0;text-align:right;color:#1e293b;font-weight:600;">${application.approvedRate}% APR</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#475569;">Term:</td>
                    <td style="padding:8px 0;text-align:right;color:#1e293b;font-weight:600;">${application.approvedTerm} months</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#475569;">Monthly Payment:</td>
                    <td style="padding:8px 0;text-align:right;color:#10b981;font-weight:700;font-size:18px;">$${application.monthlyPayment.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#475569;">Total Repayment:</td>
                    <td style="padding:8px 0;text-align:right;color:#1e293b;font-weight:600;">$${application.totalRepayment.toLocaleString()}</td>
                  </tr>
                </table>
              </div>
              
              ${application.conditions?.length > 0 ? `
              <div style="background:#fef3c7;border-radius:8px;padding:16px;margin:24px 0;">
                <p style="margin:0 0 8px;font-size:14px;color:#b45309;font-weight:600;">Conditions:</p>
                <ul style="margin:0;padding-left:20px;color:#92400e;font-size:14px;">
                  ${application.conditions.map((c: string) => `<li>${c}</li>`).join('')}
                </ul>
              </div>
              ` : ''}
              
              <p style="font-size:14px;color:#64748b;line-height:1.6;">
                The funds will be disbursed to your account shortly. You will receive another notification once the disbursement is complete.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;padding:24px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#64748b;">© ${new Date().getFullYear()} Horizon Global Capital Ltd.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await (mail as any).sendEmail({
    to: application.userEmail,
    subject: `Loan Approved! - ${application.applicationNumber}`,
    html,
  });
}

async function sendLoanRejectionEmail(application: any): Promise<void> {
  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#0f172a 100%);padding:32px;text-align:center;">
              <span style="font-size:28px;font-weight:800;color:#D4AF37;">HORIZON</span>
              <div style="font-size:11px;color:#94a3b8;letter-spacing:2px;margin-top:4px;">GLOBAL CAPITAL</div>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h1 style="margin:0 0 24px;font-size:24px;color:#1e293b;">Loan Application Update</h1>
              <p style="font-size:16px;color:#475569;line-height:1.6;">Dear ${application.userName},</p>
              <p style="font-size:16px;color:#475569;line-height:1.6;">
                After careful review, we regret to inform you that we are unable to approve your loan application at this time.
              </p>
              
              <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:24px 0;">
                <p style="margin:0;font-size:14px;color:#dc2626;">
                  <strong>Reason:</strong> ${application.rejectionReason}
                </p>
              </div>
              
              <p style="font-size:14px;color:#64748b;line-height:1.6;">
                This decision does not affect your ability to apply for other products. We encourage you to reapply in the future once your circumstances have changed.
              </p>
              <p style="font-size:14px;color:#64748b;line-height:1.6;">
                If you have questions, please contact our support team.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;padding:24px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#64748b;">© ${new Date().getFullYear()} Horizon Global Capital Ltd.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await (mail as any).sendEmail({
    to: application.userEmail,
    subject: `Loan Application Update - ${application.applicationNumber}`,
    html,
  });
}

async function sendLoanDisbursementEmail(application: any): Promise<void> {
  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#0f172a 100%);padding:32px;text-align:center;">
              <span style="font-size:28px;font-weight:800;color:#D4AF37;">HORIZON</span>
              <div style="font-size:11px;color:#94a3b8;letter-spacing:2px;margin-top:4px;">GLOBAL CAPITAL</div>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <div style="text-align:center;margin-bottom:32px;">
                <div style="width:80px;height:80px;background:#10b98120;border-radius:50%;margin:0 auto 16px;line-height:80px;font-size:36px;">💰</div>
                <h1 style="margin:0;font-size:24px;color:#10b981;">Funds Disbursed!</h1>
              </div>
              
              <p style="font-size:16px;color:#475569;line-height:1.6;">Dear ${application.userName},</p>
              <p style="font-size:16px;color:#475569;line-height:1.6;">
                Great news! Your loan funds have been disbursed to your account.
              </p>
              
              <div style="background:#f8fafc;border-radius:12px;padding:24px;margin:24px 0;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:8px 0;color:#64748b;">Amount Disbursed:</td>
                    <td style="padding:8px 0;text-align:right;color:#10b981;font-weight:700;font-size:24px;">$${application.disbursedAmount.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#64748b;">Reference:</td>
                    <td style="padding:8px 0;text-align:right;color:#1e293b;font-family:monospace;">${application.disbursementReference}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#64748b;">First Payment Due:</td>
                    <td style="padding:8px 0;text-align:right;color:#1e293b;font-weight:600;">${new Date(application.nextPaymentDate).toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#64748b;">Monthly Payment:</td>
                    <td style="padding:8px 0;text-align:right;color:#1e293b;font-weight:600;">$${application.monthlyPayment.toLocaleString()}</td>
                  </tr>
                </table>
              </div>
              
              <p style="font-size:14px;color:#64748b;line-height:1.6;">
                Please ensure your account has sufficient funds for the monthly payment. Thank you for choosing Horizon Global Capital.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;padding:24px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#64748b;">© ${new Date().getFullYear()} Horizon Global Capital Ltd.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await (mail as any).sendEmail({
    to: application.userEmail,
    subject: `Loan Disbursed - ${application.applicationNumber}`,
    html,
  });
}

async function sendDocumentsRequestEmail(application: any, requiredDocuments: string[]): Promise<void> {
  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#0f172a 100%);padding:32px;text-align:center;">
              <span style="font-size:28px;font-weight:800;color:#D4AF37;">HORIZON</span>
              <div style="font-size:11px;color:#94a3b8;letter-spacing:2px;margin-top:4px;">GLOBAL CAPITAL</div>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h1 style="margin:0 0 24px;font-size:24px;color:#1e293b;">Documents Required</h1>
              <p style="font-size:16px;color:#475569;line-height:1.6;">Dear ${application.userName},</p>
              <p style="font-size:16px;color:#475569;line-height:1.6;">
                To continue processing your loan application, please provide the following documents:
              </p>
              
              <div style="background:#fef3c7;border-radius:8px;padding:16px;margin:24px 0;">
                <ul style="margin:0;padding-left:20px;color:#92400e;font-size:14px;">
                  ${requiredDocuments.map(doc => `<li style="margin:8px 0;">${doc}</li>`).join('')}
                </ul>
              </div>
              
              <p style="font-size:14px;color:#64748b;line-height:1.6;">
                Please upload these documents through your account dashboard or reply to this email with the attachments.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;padding:24px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#64748b;">© ${new Date().getFullYear()} Horizon Global Capital Ltd.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await (mail as any).sendEmail({
    to: application.userEmail,
    subject: `Documents Required - ${application.applicationNumber}`,
    html,
  });
}

export { LoanApplication, LOAN_TYPES as LoanTypes };
