// Loan status lifecycle as per BRD
export enum LoanStatus {
  APPLICATION = 'APPLICATION', // Initial application submitted
  UNDER_REVIEW = 'UNDER_REVIEW', // AI risk scoring + manual review
  APPROVED = 'APPROVED', // Approved by loan committee
  DISBURSED = 'DISBURSED', // Amount credited to account
  ACTIVE = 'ACTIVE', // Currently in repayment
  COMPLETED = 'COMPLETED', // Fully repaid
  DEFAULTED = 'DEFAULTED', // Payment default > NPA days
  CLOSED = 'CLOSED', // Closed without completion
}

export enum LoanType {
  SHORT_TERM = 'SHORT_TERM', // Up to 12 months
  MEDIUM_TERM = 'MEDIUM_TERM', // 1-3 years
  LONG_TERM = 'LONG_TERM', // 3+ years
  GOLD_LOAN = 'GOLD_LOAN', // Secured by gold
}

export enum NPAStatus {
  STANDARD = 'STANDARD', // No overdue
  SUB_STANDARD = 'SUB_STANDARD', // 90-180 days overdue
  DOUBTFUL = 'DOUBTFUL', // 180+ days overdue
  LOSS = 'LOSS', // Written off
}

export interface Loan {
  id: string;
  loanId: string; // Auto-generated LN-YYYY-######
  tenantId: string;
  memberId: string;
  guarantorIds: string[]; // Multiple guarantors possible

  // Loan details
  loanType: LoanType;
  principalAmount: number;
  interestRate: number; // % per annum
  loanTerm: number; // In months
  status: LoanStatus;
  
  // Important dates
  applicationDate: Date;
  approvalDate?: Date;
  disbursementDate?: Date;
  maturityDate?: Date;

  // Repayment
  emiAmount: number;
  repaymentFrequency: 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY';
  totalInterest: number;
  totalOutstanding: number;
  paidPrincipal: number;
  paidInterest: number;
  lastPaymentDate?: Date;

  // NPA tracking
  npaStatus: NPAStatus;
  overdueDays: number;
  npaDays: number;
  daysOverdue90: number; // For provision calculation

  // AI risk scoring
  aiRiskScore: number; // 0-100
  aiRiskScoreExplanation: string;
  aiRiskScoredAt: Date;

  // Additional features
  moratoriumMonths?: number;
  restructureCount: number;
  penalInterestApplied: boolean;
  penalInterestRate?: number;

  // System fields
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
  deletedAt?: Date;
}

export interface LoanApplication {
  id: string;
  memberId: string;
  tenantId: string;
  loanType: LoanType;
  requestedAmount: number;
  requestedTerm: number;
  purpose: string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  submittedDate: Date;
  rejectionReason?: string;
  documents: {
    documentType: string;
    documentUrl: string;
    uploadedAt: Date;
  }[];
  createdAt: Date;
}

export interface LoanRepayment {
  id: string;
  loanId: string;
  memberId: string;
  tenantId: string;
  principalAmount: number;
  interestAmount: number;
  penalAmount: number;
  totalAmount: number;
  paymentDate: Date;
  paymentMode: 'CASH' | 'CHEQUE' | 'BANK_TRANSFER' | 'STANDING_INSTRUCTION';
  referenceNumber: string;
  status: 'PENDING' | 'POSTED' | 'REVERSED';
  notes?: string;
  createdAt: Date;
  createdBy: string;
}

export interface LoanEMISchedule {
  id: string;
  loanId: string;
  dueDate: Date;
  sequenceNumber: number;
  principalAmount: number;
  interestAmount: number;
  emiAmount: number;
  outstandingAmount: number;
  status: 'DUE' | 'PAID' | 'OVERDUE' | 'WAIVED';
  paidDate?: Date;
  paidAmount?: number;
}

export interface LoanApprovalWorkflow {
  id: string;
  loanId: string;
  tenantId: string;
  approvalLevel: number; // 1-4
  approverRole: string;
  maxAmount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approverUserId?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
}

export interface LoanGuarantor {
  id: string;
  loanId: string;
  guarantorMemberId: string;
  guaranteeAmount: number;
  createdAt: Date;
}
